import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_CONFIG, handleStripeError } from '@/lib/stripe/config';
import { dbConnect } from '@/lib/mongodb/connect';
import { withAuth } from '@/lib/middleware/auth';
import User from '@/lib/mongodb/models/user.model';
import Price from '@/lib/mongodb/models/price.model';
import Insight from '@/lib/mongodb/models/insight.model';
import SubscriptionHistory from '@/lib/mongodb/models/subscription-history.model';
import { v4 as uuidv4 } from 'uuid';

interface CreateCheckoutSessionRequest {
  priceId: string;
  planId: string; // insights.kantor_version
  billingPeriod: 'monthly' | 'annual';
  successUrl?: string;
  cancelUrl?: string;
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, { userId, companyId }) => {
    try {
      await dbConnect();

      const body: CreateCheckoutSessionRequest = await request.json();
      const { priceId, planId, billingPeriod, successUrl, cancelUrl } = body;

      // Validate required fields
      if (!priceId || !planId || !billingPeriod) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Missing required fields: priceId, planId, and billingPeriod are required' 
          },
          { status: 400 }
        );
      }

      // Get user information
      const user = await User.findOne({ id: userId }).select('-password');
      if (!user) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }

      // Check if user already has an active subscription
      if (user.subscription_status === 'active' || user.subscription_status === 'trial') {
        return NextResponse.json(
          { 
            success: false, 
            message: 'User already has an active subscription. Please cancel the current subscription first.' 
          },
          { status: 409 }
        );
      }

      // Validate the price and plan exist
      const priceRecord = await Price.findOne({ 
        stripe_price_id: priceId,
        kantor_version: planId,
        billing_period: billingPeriod,
        is_active: true 
      });

      if (!priceRecord) {
        return NextResponse.json(
          { success: false, message: 'Invalid price or plan configuration' },
          { status: 400 }
        );
      }

      // Get plan features from insights
      const planInsight = await Insight.findOne({ kantor_version: planId });
      if (!planInsight) {
        return NextResponse.json(
          { success: false, message: 'Plan not found' },
          { status: 404 }
        );
      }

      // Create or retrieve Stripe customer
      let stripeCustomer: any;
      
      if (user.stripe_customer_id) {
        try {
          stripeCustomer = await stripe.customers.retrieve(user.stripe_customer_id);
          if (stripeCustomer.deleted) {
            stripeCustomer = null;
          }
        } catch (error) {
          console.error('Error retrieving existing customer:', error);
          stripeCustomer = null;
        }
      }

      if (!stripeCustomer) {
        stripeCustomer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: {
            userId: userId,
            companyId: companyId,
            internalUserId: user.id,
          },
        });

        // Update user with customer ID
        await User.findOneAndUpdate(
          { id: userId },
          { stripe_customer_id: stripeCustomer.id }
        );
      }

      // Calculate trial end date
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + STRIPE_CONFIG.trialPeriodDays);

      // Create checkout session configuration
      const sessionConfig: any = {
        customer: stripeCustomer.id,
        payment_method_types: STRIPE_CONFIG.paymentMethods,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl || `${STRIPE_CONFIG.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || STRIPE_CONFIG.cancelUrl,
        subscription_data: {
          trial_period_days: priceRecord.price_value > 0 ? STRIPE_CONFIG.trialPeriodDays : undefined,
          metadata: {
            userId: userId,
            companyId: companyId,
            planId: planId,
            billingPeriod: billingPeriod,
            internalUserId: user.id,
          },
        },
        metadata: {
          userId: userId,
          companyId: companyId,
          planId: planId,
          billingPeriod: billingPeriod,
          internalUserId: user.id,
        },
        allow_promotion_codes: STRIPE_CONFIG.features.allowPromotionCodes,
        billing_address_collection: STRIPE_CONFIG.features.collectBillingAddress ? 'required' : 'auto',
        phone_number_collection: {
          enabled: STRIPE_CONFIG.features.collectPhoneNumber,
        },
        customer_update: {
          address: 'auto',
        },
        locale: STRIPE_CONFIG.defaultLocale,
      };

      // For free plans, skip trial and activate immediately
      if (priceRecord.price_value === 0) {
        delete sessionConfig.subscription_data.trial_period_days;
      }

      // Create the checkout session
      const session = await stripe.checkout.sessions.create(sessionConfig);

      // Update user with pending subscription data
      await User.findOneAndUpdate(
        { id: userId },
        {
          current_plan_id: planId,
          billing_period: billingPeriod,
          trial_end_date: priceRecord.price_value > 0 ? trialEndDate : undefined,
          subscription_status: 'incomplete',
        }
      );

      // Log the subscription creation attempt
      const historyEntry = new SubscriptionHistory({
        history_id: uuidv4(),
        user_id: userId,
        company_id: companyId,
        action: 'created',
        new_status: 'incomplete',
        new_plan: planId,
        amount: priceRecord.price_value,
        currency: priceRecord.currency_id,
        billing_period: billingPeriod,
        metadata: {
          stripe_session_id: session.id,
          stripe_customer_id: stripeCustomer.id,
          price_id: priceId,
        },
        created_by: userId,
      });

      await historyEntry.save();

      return NextResponse.json({
        success: true,
        sessionId: session.id,
        url: session.url,
        customer: stripeCustomer.id,
        trialDays: priceRecord.price_value > 0 ? STRIPE_CONFIG.trialPeriodDays : 0,
      });

    } catch (error: any) {
      console.error('Checkout session creation error:', error);

      // Handle Stripe-specific errors
      if (error.type && error.type.startsWith('Stripe')) {
        const stripeError = handleStripeError(error);
        return NextResponse.json(
          { success: false, message: stripeError.message, code: stripeError.code },
          { status: stripeError.statusCode }
        );
      }

      // Handle database or other errors
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to create checkout session. Please try again.',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      );
    }
  });
}

// GET method to retrieve session status
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, { userId }) => {
    try {
      await dbConnect();

      const { searchParams } = new URL(request.url);
      const sessionId = searchParams.get('sessionId');

      if (!sessionId) {
        return NextResponse.json(
          { success: false, message: 'Session ID is required' },
          { status: 400 }
        );
      }

      // Retrieve session from Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription', 'customer'],
      });

      // Verify the session belongs to the authenticated user
      const user = await User.findOne({ id: userId });
      if (!user || session.customer !== user.stripe_customer_id) {
        return NextResponse.json(
          { success: false, message: 'Session not found or unauthorized' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        session: {
          id: session.id,
          status: session.status,
          payment_status: session.payment_status,
          amount_total: session.amount_total,
          currency: session.currency,
          customer_email: session.customer_details?.email,
        },
        subscription: session.subscription ? {
          id: session.subscription,
          status: (session.subscription as any).status,
        } : null,
      });

    } catch (error: any) {
      console.error('Session retrieval error:', error);

      if (error.type && error.type.startsWith('Stripe')) {
        const stripeError = handleStripeError(error);
        return NextResponse.json(
          { success: false, message: stripeError.message },
          { status: stripeError.statusCode }
        );
      }

      return NextResponse.json(
        { success: false, message: 'Failed to retrieve session' },
        { status: 500 }
      );
    }
  });
}