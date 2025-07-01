import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe/config';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { withAuth } from '@/lib/middleware/auth';
import Subscription from '@/lib/mongodb/models/subscription.model';
import User from '@/lib/mongodb/models/user.model';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, { userId, companyId }) => {
    try {
      await connectToDatabase();

      const body = await request.json();
      const { priceId, kantor_version, billing_period } = body;

      if (!priceId || !kantor_version || !billing_period) {
        return NextResponse.json(
          { success: false, message: 'Missing required parameters' },
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
      const existingSubscription = await Subscription.findOne({
        company_id: companyId,
        status: { $in: ['active', 'trial'] }
      });

      if (existingSubscription) {
        return NextResponse.json(
          { success: false, message: 'Company already has an active subscription' },
          { status: 409 }
        );
      }

      // Create or retrieve Stripe customer
      let customer;
      const existingCustomers = await stripe.customers.list({
        email: user.email,
        limit: 1
      });

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
      } else {
        customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: {
            userId: userId,
            companyId: companyId
          }
        });
      }

      // Create Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${STRIPE_CONFIG.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: STRIPE_CONFIG.cancelUrl,
        subscription_data: {
          trial_period_days: STRIPE_CONFIG.trialPeriodDays,
          metadata: {
            userId: userId,
            companyId: companyId,
            kantor_version: kantor_version
          }
        },
        metadata: {
          userId: userId,
          companyId: companyId,
          kantor_version: kantor_version,
          billing_period: billing_period
        },
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        phone_number_collection: {
          enabled: true
        }
      });

      // Create a pending subscription record
      const subscriptionId = uuidv4();
      const trialStart = new Date();
      const trialEnd = new Date();
      trialEnd.setDate(trialStart.getDate() + STRIPE_CONFIG.trialPeriodDays);

      const newSubscription = new Subscription({
        subscription_id: subscriptionId,
        company_id: companyId,
        user_id: userId,
        kantor_version: kantor_version,
        stripe_customer_id: customer.id,
        status: 'incomplete',
        current_period_start: trialStart,
        current_period_end: trialEnd,
        trial_start: trialStart,
        trial_end: trialEnd,
        billing_period: billing_period,
        amount: 0, // Will be updated by webhook
        currency: STRIPE_CONFIG.currency
      });

      await newSubscription.save();

      return NextResponse.json({
        success: true,
        url: session.url,
        sessionId: session.id
      });

    } catch (error) {
      console.error('Error creating checkout session:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create checkout session' },
        { status: 500 }
      );
    }
  });
}