import { NextRequest, NextResponse } from 'next/server';
import { stripe, handleStripeError } from '@/lib/stripe/config';
import { dbConnect } from '@/lib/mongodb/connect';
import { withAuth } from '@/lib/middleware/auth';
import User from '@/lib/mongodb/models/user.model';
import Subscription from '@/lib/mongodb/models/subscription.model';
import SubscriptionHistory from '@/lib/mongodb/models/subscription-history.model';
import Insight from '@/lib/mongodb/models/insight.model';

// GET /api/subscription-status - Get current subscription status and details
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, { userId, companyId }) => {
    try {
      await dbConnect();

      // Get user with subscription details
      const user = await User.findOne({ id: userId }).select('-password');
      if (!user) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }

      // Get subscription record
      const subscription = await Subscription.findOne({
        user_id: userId,
        company_id: companyId,
      }).sort({ created_at: -1 });

      // Get plan details
      let planDetails = null;
      if (user.current_plan_id) {
        planDetails = await Insight.findOne({ 
          kantor_version: user.current_plan_id 
        });
      }

      // Get Stripe subscription details if available
      let stripeSubscription = null;
      if (user.subscription_id) {
        try {
          stripeSubscription = await stripe.subscriptions.retrieve(user.subscription_id, {
            expand: ['default_payment_method', 'latest_invoice'],
          });
        } catch (error) {
          console.error('Error fetching Stripe subscription:', error);
          // Continue without Stripe data
        }
      }

      // Calculate trial status
      const now = new Date();
      const isInTrial = user.trial_end_date && user.trial_end_date > now;
      const trialDaysLeft = isInTrial 
        ? Math.ceil((user.trial_end_date!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // Get recent subscription history
      const recentHistory = await SubscriptionHistory.find({
        user_id: userId,
        company_id: companyId,
      })
      .sort({ created_at: -1 })
      .limit(10)
      .lean();

      const response = {
        success: true,
        data: {
          // User subscription status
          subscription: {
            status: user.subscription_status || 'inactive',
            planId: user.current_plan_id,
            planName: planDetails?.kantor_version,
            billingPeriod: user.billing_period,
            startDate: user.subscription_start_date,
            endDate: user.subscription_end_date,
            isActive: ['active', 'trial'].includes(user.subscription_status || ''),
            isCanceled: user.subscription_status === 'canceled',
            isPastDue: user.subscription_status === 'past_due',
          },
          
          // Trial information
          trial: {
            isInTrial,
            endDate: user.trial_end_date,
            daysLeft: trialDaysLeft,
            hasTrialEnded: user.trial_end_date && user.trial_end_date <= now,
          },
          
          // Plan details
          plan: planDetails ? {
            name: planDetails.kantor_version,
            description: planDetails.description,
            features: planDetails.features || [],
            insightsLimit: planDetails.insights_limit,
            priceMonthly: planDetails.price_monthly,
          } : null,
          
          // Stripe details (if available)
          stripe: stripeSubscription ? {
            subscriptionId: stripeSubscription.id,
            customerId: user.stripe_customer_id,
            status: stripeSubscription.status,
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
            canceledAt: stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000) : null,
            paymentMethod: stripeSubscription.default_payment_method ? {
              type: (stripeSubscription.default_payment_method as any).type,
              card: (stripeSubscription.default_payment_method as any).card ? {
                brand: (stripeSubscription.default_payment_method as any).card.brand,
                last4: (stripeSubscription.default_payment_method as any).card.last4,
                expMonth: (stripeSubscription.default_payment_method as any).card.exp_month,
                expYear: (stripeSubscription.default_payment_method as any).card.exp_year,
              } : null,
            } : null,
            latestInvoice: stripeSubscription.latest_invoice ? {
              id: (stripeSubscription.latest_invoice as any).id,
              status: (stripeSubscription.latest_invoice as any).status,
              amountPaid: (stripeSubscription.latest_invoice as any).amount_paid,
              amountDue: (stripeSubscription.latest_invoice as any).amount_due,
              currency: (stripeSubscription.latest_invoice as any).currency,
              paidAt: (stripeSubscription.latest_invoice as any).status_transitions?.paid_at 
                ? new Date((stripeSubscription.latest_invoice as any).status_transitions.paid_at * 1000)
                : null,
            } : null,
          } : null,
          
          // Usage and limits
          usage: {
            insightsUsed: (user.insightsLeft || 0) < 20 ? 20 - (user.insightsLeft || 0) : 0,
            insightsLeft: user.insightsLeft || 0,
            insightsLimit: planDetails?.insights_limit || 20,
            resetDay: user.insightsDay || 1,
          },
          
          // Recent activity
          history: recentHistory.map(h => ({
            id: h.history_id,
            action: h.action,
            status: h.new_status,
            plan: h.new_plan,
            amount: h.amount,
            currency: h.currency,
            date: h.created_at,
            description: getHistoryDescription(h),
          })),
        },
      };

      return NextResponse.json(response);

    } catch (error: any) {
      console.error('Error fetching subscription status:', error);

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
          message: 'Failed to fetch subscription status',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      );
    }
  });
}

// Helper function to generate human-readable history descriptions
function getHistoryDescription(history: any): string {
  switch (history.action) {
    case 'created':
      return `Subscription created for ${history.new_plan || 'plan'}`;
    case 'updated':
      return history.previous_plan && history.new_plan && history.previous_plan !== history.new_plan
        ? `Plan changed from ${history.previous_plan} to ${history.new_plan}`
        : 'Subscription updated';
    case 'canceled':
      return 'Subscription canceled';
    case 'trial_started':
      return 'Trial period started';
    case 'trial_ended':
      return 'Trial period ended';
    case 'payment_succeeded':
      return `Payment of ${history.amount ? (history.amount / 100).toFixed(2) : '0.00'} ${(history.currency || 'USD').toUpperCase()} processed successfully`;
    case 'payment_failed':
      return `Payment of ${history.amount ? (history.amount / 100).toFixed(2) : '0.00'} ${(history.currency || 'USD').toUpperCase()} failed`;
    case 'paused':
      return 'Subscription paused';
    case 'resumed':
      return 'Subscription resumed';
    default:
      return 'Subscription activity';
  }
}