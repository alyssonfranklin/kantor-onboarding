import { NextRequest, NextResponse } from 'next/server';
import { stripe, handleStripeError } from '@/lib/stripe/config';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { withAuth } from '@/lib/middleware/auth';
import User from '@/lib/mongodb/models/user.model';
import Subscription from '@/lib/mongodb/models/subscription.model';
import SubscriptionHistory from '@/lib/mongodb/models/subscription-history.model';
import { v4 as uuidv4 } from 'uuid';

interface CancelSubscriptionRequest {
  immediately?: boolean; // Cancel immediately vs at period end
  reason?: string; // Cancellation reason
  feedback?: string; // Optional feedback
}

// POST /api/cancel-subscription - Cancel user's subscription
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, { userId, companyId }) => {
    try {
      await connectToDatabase();

      const body: CancelSubscriptionRequest = await request.json();
      const { immediately = false, reason, feedback } = body;

      // Get user and subscription info
      const user = await User.findOne({ id: userId }).select('-password');
      if (!user) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }

      if (!user.subscription_id) {
        return NextResponse.json(
          { success: false, message: 'No active subscription found' },
          { status: 404 }
        );
      }

      if (user.subscription_status === 'canceled') {
        return NextResponse.json(
          { success: false, message: 'Subscription is already canceled' },
          { status: 400 }
        );
      }

      // Get current subscription from Stripe
      let stripeSubscription;
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(user.subscription_id);
      } catch (error) {
        console.error('Error retrieving Stripe subscription:', error);
        return NextResponse.json(
          { success: false, message: 'Subscription not found in payment processor' },
          { status: 404 }
        );
      }

      // Cancel subscription in Stripe
      let canceledSubscription;
      if (immediately) {
        // Cancel immediately
        canceledSubscription = await stripe.subscriptions.cancel(user.subscription_id, {
          prorate: true, // Prorate the cancellation
        });
      } else {
        // Cancel at period end
        canceledSubscription = await stripe.subscriptions.update(user.subscription_id, {
          cancel_at_period_end: true,
          cancellation_details: {
            comment: reason || 'User requested cancellation',
            feedback: feedback || undefined,
          },
          metadata: {
            canceled_by: userId,
            canceled_at: new Date().toISOString(),
            cancellation_reason: reason || 'user_request',
          },
        });
      }

      // Update user subscription status
      const updateData: any = {
        subscription_status: immediately ? 'canceled' : 'active', // Keep active until period end if not immediate
      };

      if (immediately) {
        updateData.subscription_end_date = new Date();
      }

      await User.findOneAndUpdate(
        { id: userId },
        updateData
      );

      // Update subscription record
      await Subscription.findOneAndUpdate(
        { stripe_subscription_id: user.subscription_id },
        {
          status: immediately ? 'canceled' : 'active',
          updated_at: new Date(),
        }
      );

      // Log the cancellation
      const historyEntry = new SubscriptionHistory({
        history_id: uuidv4(),
        user_id: userId,
        company_id: companyId,
        subscription_id: user.subscription_id,
        stripe_subscription_id: user.subscription_id,
        action: 'canceled',
        previous_status: user.subscription_status,
        new_status: immediately ? 'canceled' : 'active',
        previous_plan: user.current_plan_id,
        new_plan: user.current_plan_id,
        metadata: {
          cancellation_type: immediately ? 'immediate' : 'at_period_end',
          cancellation_reason: reason,
          feedback: feedback,
          canceled_by: userId,
          stripe_canceled_at: canceledSubscription.canceled_at,
          cancel_at_period_end: canceledSubscription.cancel_at_period_end,
          current_period_end: canceledSubscription.current_period_end,
        },
        created_by: userId,
      });

      await historyEntry.save();

      // Prepare response
      const response = {
        success: true,
        message: immediately 
          ? 'Subscription canceled successfully' 
          : 'Subscription will be canceled at the end of the current billing period',
        data: {
          cancellationType: immediately ? 'immediate' : 'at_period_end',
          canceled: immediately,
          cancelAtPeriodEnd: !immediately,
          currentPeriodEnd: canceledSubscription.current_period_end 
            ? new Date(canceledSubscription.current_period_end * 1000)
            : null,
          refundAmount: immediately && canceledSubscription.latest_invoice 
            ? calculateRefund(stripeSubscription, canceledSubscription)
            : 0,
          accessUntil: immediately 
            ? new Date()
            : (canceledSubscription.current_period_end 
                ? new Date(canceledSubscription.current_period_end * 1000)
                : new Date()),
        },
      };

      return NextResponse.json(response);

    } catch (error: any) {
      console.error('Error canceling subscription:', error);

      if (error.type && error.type.startsWith('Stripe')) {
        const stripeError = handleStripeError(error);
        return NextResponse.json(
          { success: false, message: stripeError.message },
          { status: stripeError.statusCode }
        );
      }

      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to cancel subscription. Please try again.',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      );
    }
  });
}

// GET /api/cancel-subscription - Get cancellation preview (what will happen if canceled)
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, { userId }) => {
    try {
      await connectToDatabase();

      const { searchParams } = new URL(request.url);
      const immediately = searchParams.get('immediately') === 'true';

      // Get user and subscription info
      const user = await User.findOne({ id: userId }).select('-password');
      if (!user) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }

      if (!user.subscription_id) {
        return NextResponse.json(
          { success: false, message: 'No active subscription found' },
          { status: 404 }
        );
      }

      // Get current subscription from Stripe
      let stripeSubscription;
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(user.subscription_id, {
          expand: ['latest_invoice'],
        });
      } catch (error) {
        console.error('Error retrieving Stripe subscription:', error);
        return NextResponse.json(
          { success: false, message: 'Subscription not found' },
          { status: 404 }
        );
      }

      // Calculate what will happen
      const currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
      const now = new Date();
      const daysUntilPeriodEnd = Math.ceil((currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      let refundAmount = 0;
      if (immediately) {
        refundAmount = calculateRefund(stripeSubscription, null);
      }

      const preview = {
        success: true,
        data: {
          currentStatus: stripeSubscription.status,
          billingPeriod: user.billing_period,
          currentPeriodEnd: currentPeriodEnd,
          daysUntilPeriodEnd: Math.max(0, daysUntilPeriodEnd),
          
          immediate: {
            available: true,
            accessEndsImmediately: true,
            refundAmount: refundAmount,
            refundCurrency: stripeSubscription.currency,
          },
          
          atPeriodEnd: {
            available: true,
            accessEndsAt: currentPeriodEnd,
            refundAmount: 0,
            continueUntil: currentPeriodEnd,
          },

          recommendations: {
            suggested: daysUntilPeriodEnd > 7 ? 'at_period_end' : 'immediate',
            reasons: daysUntilPeriodEnd > 7 
              ? [`You have ${daysUntilPeriodEnd} days left in your current billing period`, 'Continue using the service until your period ends']
              : ['Your billing period ends soon', 'You may prefer to cancel immediately'],
          },
        },
      };

      return NextResponse.json(preview);

    } catch (error: any) {
      console.error('Error getting cancellation preview:', error);

      if (error.type && error.type.startsWith('Stripe')) {
        const stripeError = handleStripeError(error);
        return NextResponse.json(
          { success: false, message: stripeError.message },
          { status: stripeError.statusCode }
        );
      }

      return NextResponse.json(
        { success: false, message: 'Failed to get cancellation preview' },
        { status: 500 }
      );
    }
  });
}

// Helper function to calculate refund amount for immediate cancellation
function calculateRefund(subscription: any, canceledSubscription: any): number {
  try {
    if (!subscription.latest_invoice) {
      return 0;
    }

    const invoice = subscription.latest_invoice;
    const now = Math.floor(Date.now() / 1000);
    const periodStart = subscription.current_period_start;
    const periodEnd = subscription.current_period_end;
    
    // Calculate unused time
    const totalPeriod = periodEnd - periodStart;
    const usedTime = now - periodStart;
    const unusedTime = Math.max(0, periodEnd - now);
    
    // Calculate prorated refund
    const unusedPercentage = unusedTime / totalPeriod;
    const refundAmount = Math.floor((invoice.amount_paid || 0) * unusedPercentage);
    
    return Math.max(0, refundAmount);
  } catch (error) {
    console.error('Error calculating refund:', error);
    return 0;
  }
}