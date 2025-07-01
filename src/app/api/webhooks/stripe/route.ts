import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe/config';
import { connectToDatabase } from '@/lib/mongodb/connect';
import User from '@/lib/mongodb/models/user.model';
import Subscription from '@/lib/mongodb/models/subscription.model';
import Payment from '@/lib/mongodb/models/payment.model';
import SubscriptionHistory from '@/lib/mongodb/models/subscription-history.model';
import Company from '@/lib/mongodb/models/company.model';
import { sendSubscriptionEmail } from '@/lib/email/subscription-emails';
import { v4 as uuidv4 } from 'uuid';

// Configure Next.js to allow raw body parsing for webhooks
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    await connectToDatabase();

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    // Enhanced security checks
    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Check webhook endpoint security
    if (!STRIPE_CONFIG.webhookSecret) {
      console.error('Webhook secret not configured');
      return NextResponse.json(
        { error: 'Webhook not properly configured' },
        { status: 500 }
      );
    }

    let event: any;
    
    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_CONFIG.webhookSecret);
    } catch (error: any) {
      console.error('Webhook signature verification failed:', error.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log(`Processing webhook event: ${event.type} (${event.id}) at ${new Date().toISOString()}`);

    // Check for duplicate events
    const existingHistory = await SubscriptionHistory.findOne({
      stripe_event_id: event.id
    });

    if (existingHistory) {
      console.log(`Event ${event.id} already processed, skipping`);
      return NextResponse.json({ received: true });
    }

    // Process the event based on type
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event);
        break;

      case 'invoice.upcoming':
        await handleUpcomingInvoice(event);
        break;

      case 'invoice.payment_action_required':
        await handlePaymentActionRequired(event);
        break;

      case 'customer.updated':
        await handleCustomerUpdated(event);
        break;

      case 'payment_method.attached':
        await handlePaymentMethodAttached(event);
        break;

      case 'customer.subscription.paused':
        await handleSubscriptionPaused(event);
        break;

      case 'customer.subscription.resumed':
        await handleSubscriptionResumed(event);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    const processingTime = Date.now() - startTime;
    console.log(`Webhook ${event.type} processed successfully in ${processingTime}ms`);

    return NextResponse.json({ 
      received: true,
      processed: true,
      event_id: event.id,
      processing_time_ms: processingTime,
    });

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error(`Webhook processing error after ${processingTime}ms:`, error);
    
    // Return 200 for known errors to prevent Stripe retries
    const knownStripeErrors = ['StripeInvalidRequestError', 'StripeAuthenticationError'];
    const shouldRetry = !knownStripeErrors.includes(error.type);
    
    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        should_retry: shouldRetry,
        processing_time_ms: processingTime,
        error_type: error.type || 'unknown',
      },
      { status: shouldRetry ? 500 : 200 }
    );
  }
}

async function handleCheckoutSessionCompleted(event: any) {
  try {
    const session = event.data.object;
    const { metadata } = session;
    const { userId, companyId, planId, billingPeriod } = metadata;

    if (!userId || !companyId || !planId) {
      console.error('Missing metadata in checkout session:', metadata);
      return;
    }

    console.log(`Checkout completed for user ${userId}, plan ${planId}`);

    // Get the subscription from Stripe if it exists
    let stripeSubscription = null;
    if (session.subscription) {
      stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);
    }

    // Update user subscription status
    const updateData: any = {
      subscription_status: stripeSubscription?.status === 'trialing' ? 'trial' : 'active',
      current_plan_id: planId,
      billing_period: billingPeriod,
      subscription_start_date: new Date(),
    };

    if (stripeSubscription) {
      updateData.subscription_id = stripeSubscription.id;
      updateData.subscription_end_date = new Date(stripeSubscription.current_period_end * 1000);
      
      if (stripeSubscription.trial_end) {
        updateData.trial_end_date = new Date(stripeSubscription.trial_end * 1000);
      }
    }

    const user = await User.findOneAndUpdate(
      { id: userId },
      updateData,
      { new: true }
    );

    if (!user) {
      console.error(`User ${userId} not found for checkout completion`);
      return;
    }

    // Update company subscription
    await Company.findOneAndUpdate(
      { company_id: companyId },
      { company_subscription: planId }
    );

    // Create subscription record if it doesn't exist
    if (stripeSubscription && !await Subscription.findOne({ stripe_subscription_id: stripeSubscription.id })) {
      const subscriptionRecord = new Subscription({
        subscription_id: uuidv4(),
        company_id: companyId,
        user_id: userId,
        kantor_version: planId,
        stripe_subscription_id: stripeSubscription.id,
        stripe_customer_id: session.customer,
        status: stripeSubscription.status === 'trialing' ? 'trial' : stripeSubscription.status,
        current_period_start: new Date(stripeSubscription.current_period_start * 1000),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000),
        trial_start: stripeSubscription.trial_start ? new Date(stripeSubscription.trial_start * 1000) : undefined,
        trial_end: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : undefined,
        billing_period: billingPeriod,
        amount: stripeSubscription.items.data[0]?.price.unit_amount || 0,
        currency: stripeSubscription.currency,
      });

      await subscriptionRecord.save();
    }

    // Log the completion
    await logSubscriptionHistory({
      userId,
      companyId,
      action: 'created',
      newStatus: updateData.subscription_status,
      newPlan: planId,
      amount: stripeSubscription?.items.data[0]?.price.unit_amount || 0,
      currency: stripeSubscription?.currency || 'usd',
      billingPeriod,
      metadata: {
        stripe_session_id: session.id,
        stripe_subscription_id: stripeSubscription?.id,
        checkout_completed: true,
      },
      stripeEventId: event.id,
    });

    // Send welcome email
    try {
      await sendSubscriptionEmail('welcome', {
        userName: user.name || 'User',
        userEmail: user.email,
        companyName: user.company_name,
        planName: planId,
        amount: stripeSubscription?.items.data[0]?.price.unit_amount,
        currency: stripeSubscription?.currency,
        trialEndDate: updateData.trial_end_date,
        billingPeriod,
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    console.log(`Successfully processed checkout completion for user ${userId}`);

  } catch (error) {
    console.error('Error handling checkout session completed:', error);
    throw error;
  }
}

async function handleSubscriptionCreated(event: any) {
  try {
    const subscription = event.data.object;
    const { metadata } = subscription;
    const { userId, companyId, planId } = metadata;

    console.log(`Subscription created: ${subscription.id} for user ${userId}`);

    await logSubscriptionHistory({
      userId,
      companyId,
      action: 'created',
      newStatus: subscription.status === 'trialing' ? 'trial' : subscription.status,
      newPlan: planId,
      amount: subscription.items.data[0]?.price.unit_amount || 0,
      currency: subscription.currency,
      billingPeriod: subscription.items.data[0]?.price.recurring?.interval === 'year' ? 'annual' : 'monthly',
      metadata: {
        stripe_subscription_id: subscription.id,
        trial_start: subscription.trial_start,
        trial_end: subscription.trial_end,
      },
      stripeEventId: event.id,
    });

  } catch (error) {
    console.error('Error handling subscription created:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(event: any) {
  try {
    const subscription = event.data.object;
    const previousAttributes = event.data.previous_attributes;

    // Find user by subscription ID
    const user = await User.findOne({ subscription_id: subscription.id });
    if (!user) {
      console.error(`User not found for subscription ${subscription.id}`);
      return;
    }

    // Update user subscription data
    const updateData: any = {
      subscription_status: subscription.status === 'trialing' ? 'trial' : subscription.status,
      subscription_end_date: new Date(subscription.current_period_end * 1000),
    };

    if (subscription.trial_end) {
      updateData.trial_end_date = new Date(subscription.trial_end * 1000);
    }

    await User.findOneAndUpdate(
      { id: user.id },
      updateData
    );

    // Update subscription record
    await Subscription.findOneAndUpdate(
      { stripe_subscription_id: subscription.id },
      {
        status: subscription.status === 'trialing' ? 'trial' : subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        amount: subscription.items.data[0]?.price.unit_amount || 0,
        updated_at: new Date(),
      }
    );

    await logSubscriptionHistory({
      userId: user.id,
      companyId: user.company_id,
      action: 'updated',
      previousStatus: previousAttributes?.status,
      newStatus: subscription.status === 'trialing' ? 'trial' : subscription.status,
      amount: subscription.items.data[0]?.price.unit_amount || 0,
      currency: subscription.currency,
      metadata: {
        stripe_subscription_id: subscription.id,
        previous_attributes: previousAttributes,
      },
      stripeEventId: event.id,
    });

    console.log(`Subscription updated: ${subscription.id}`);

  } catch (error) {
    console.error('Error handling subscription updated:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(event: any) {
  try {
    const subscription = event.data.object;

    // Find user by subscription ID
    const user = await User.findOne({ subscription_id: subscription.id });
    if (!user) {
      console.error(`User not found for subscription ${subscription.id}`);
      return;
    }

    // Update user status
    await User.findOneAndUpdate(
      { id: user.id },
      {
        subscription_status: 'canceled',
        subscription_end_date: new Date(),
      }
    );

    // Update subscription record
    await Subscription.findOneAndUpdate(
      { stripe_subscription_id: subscription.id },
      {
        status: 'canceled',
        updated_at: new Date(),
      }
    );

    await logSubscriptionHistory({
      userId: user.id,
      companyId: user.company_id,
      action: 'canceled',
      previousStatus: user.subscription_status,
      newStatus: 'canceled',
      metadata: {
        stripe_subscription_id: subscription.id,
        cancellation_reason: subscription.cancellation_details?.reason,
      },
      stripeEventId: event.id,
    });

    // Send cancellation email
    try {
      await sendSubscriptionEmail('canceled', {
        userName: user.name || 'User',
        userEmail: user.email,
        companyName: user.company_name,
        planName: user.current_plan_id || 'Your Plan',
        subscriptionEndDate: new Date(),
        billingPeriod: user.billing_period,
      });
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError);
    }

    console.log(`Subscription canceled: ${subscription.id}`);

  } catch (error) {
    console.error('Error handling subscription deleted:', error);
    throw error;
  }
}

async function handleTrialWillEnd(event: any) {
  try {
    const subscription = event.data.object;

    // Find user by subscription ID
    const user = await User.findOne({ subscription_id: subscription.id });
    if (!user) {
      console.error(`User not found for subscription ${subscription.id}`);
      return;
    }

    // Calculate days left in trial
    const trialEndDate = new Date(subscription.trial_end * 1000);
    const now = new Date();
    const daysLeft = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    await logSubscriptionHistory({
      userId: user.id,
      companyId: user.company_id,
      action: 'trial_ending',
      newStatus: 'trial',
      metadata: {
        stripe_subscription_id: subscription.id,
        trial_end_date: subscription.trial_end,
        days_left: daysLeft,
        notification_sent: true,
      },
      stripeEventId: event.id,
    });

    // Send trial ending email notification
    try {
      await sendSubscriptionEmail('trial_ending', {
        userName: user.name || 'User',
        userEmail: user.email,
        companyName: user.company_name,
        planName: user.current_plan_id || 'Your Plan',
        amount: subscription.items.data[0]?.price.unit_amount,
        currency: subscription.currency,
        trialEndDate: trialEndDate,
        billingPeriod: user.billing_period,
      });
    } catch (emailError) {
      console.error('Failed to send trial ending email:', emailError);
    }

    console.log(`Trial will end for subscription: ${subscription.id}, ${daysLeft} days left`);

  } catch (error) {
    console.error('Error handling trial will end:', error);
    throw error;
  }
}

async function handlePaymentSucceeded(event: any) {
  try {
    const invoice = event.data.object;

    if (!invoice.subscription) {
      console.log('Payment succeeded for non-subscription invoice, skipping');
      return;
    }

    // Find subscription
    const subscriptionRecord = await Subscription.findOne({
      stripe_subscription_id: invoice.subscription
    });

    if (!subscriptionRecord) {
      console.error(`Subscription not found for invoice ${invoice.id}`);
      return;
    }

    // Create payment record
    const payment = new Payment({
      payment_id: uuidv4(),
      subscription_id: subscriptionRecord.subscription_id,
      company_id: subscriptionRecord.company_id,
      user_id: subscriptionRecord.user_id,
      stripe_invoice_id: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'succeeded',
      payment_method: 'card', // Could be enhanced to detect actual method
      description: `Payment for ${subscriptionRecord.kantor_version} subscription`,
      paid_at: new Date(invoice.status_transitions.paid_at * 1000),
    });

    await payment.save();

    // Update subscription status if needed
    if (subscriptionRecord.status === 'past_due') {
      await Subscription.findOneAndUpdate(
        { _id: subscriptionRecord._id },
        { 
          status: 'active',
          updated_at: new Date(),
        }
      );

      await User.findOneAndUpdate(
        { id: subscriptionRecord.user_id },
        { subscription_status: 'active' }
      );
    }

    await logSubscriptionHistory({
      userId: subscriptionRecord.user_id,
      companyId: subscriptionRecord.company_id,
      action: 'payment_succeeded',
      amount: invoice.amount_paid,
      currency: invoice.currency,
      metadata: {
        stripe_invoice_id: invoice.id,
        stripe_subscription_id: invoice.subscription,
        payment_method: invoice.payment_intent?.payment_method_types?.[0],
      },
      stripeEventId: event.id,
    });

    // Get user for email notification
    const user = await User.findOne({ id: subscriptionRecord.user_id });
    if (user) {
      try {
        // Get subscription for billing period info
        const stripeSubscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const nextBillingDate = new Date(stripeSubscription.current_period_end * 1000);
        
        await sendSubscriptionEmail('payment_success', {
          userName: user.name || 'User',
          userEmail: user.email,
          companyName: user.company_name,
          planName: subscriptionRecord.kantor_version || 'Your Plan',
          amount: invoice.amount_paid,
          currency: invoice.currency,
          billingPeriod: user.billing_period,
          nextBillingDate,
        });
      } catch (emailError) {
        console.error('Failed to send payment success email:', emailError);
      }
    }

    console.log(`Payment succeeded for subscription: ${subscriptionRecord.subscription_id}`);

  } catch (error) {
    console.error('Error handling payment succeeded:', error);
    throw error;
  }
}

async function handlePaymentFailed(event: any) {
  try {
    const invoice = event.data.object;

    if (!invoice.subscription) {
      console.log('Payment failed for non-subscription invoice, skipping');
      return;
    }

    // Find subscription
    const subscriptionRecord = await Subscription.findOne({
      stripe_subscription_id: invoice.subscription
    });

    if (!subscriptionRecord) {
      console.error(`Subscription not found for invoice ${invoice.id}`);
      return;
    }

    // Create failed payment record
    const payment = new Payment({
      payment_id: uuidv4(),
      subscription_id: subscriptionRecord.subscription_id,
      company_id: subscriptionRecord.company_id,
      user_id: subscriptionRecord.user_id,
      stripe_invoice_id: invoice.id,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: 'failed',
      payment_method: 'card',
      description: `Failed payment for ${subscriptionRecord.kantor_version} subscription`,
    });

    await payment.save();

    // Update subscription to past_due
    await Subscription.findOneAndUpdate(
      { _id: subscriptionRecord._id },
      { 
        status: 'past_due',
        updated_at: new Date(),
      }
    );

    await User.findOneAndUpdate(
      { id: subscriptionRecord.user_id },
      { subscription_status: 'past_due' }
    );

    await logSubscriptionHistory({
      userId: subscriptionRecord.user_id,
      companyId: subscriptionRecord.company_id,
      action: 'payment_failed',
      newStatus: 'past_due',
      amount: invoice.amount_due,
      currency: invoice.currency,
      metadata: {
        stripe_invoice_id: invoice.id,
        stripe_subscription_id: invoice.subscription,
        failure_reason: invoice.last_payment_error?.message,
      },
      stripeEventId: event.id,
    });

    // Get user for email notification
    const user = await User.findOne({ id: subscriptionRecord.user_id });
    if (user) {
      try {
        await sendSubscriptionEmail('payment_failed', {
          userName: user.name || 'User',
          userEmail: user.email,
          companyName: user.company_name,
          planName: subscriptionRecord.kantor_version || 'Your Plan',
          amount: invoice.amount_due,
          currency: invoice.currency,
          billingPeriod: user.billing_period,
        });
      } catch (emailError) {
        console.error('Failed to send payment failed email:', emailError);
      }
    }

    console.log(`Payment failed for subscription: ${subscriptionRecord.subscription_id}`);

  } catch (error) {
    console.error('Error handling payment failed:', error);
    throw error;
  }
}

async function handleUpcomingInvoice(event: any) {
  try {
    const invoice = event.data.object;
    
    if (!invoice.subscription) {
      return;
    }

    // Find subscription
    const subscriptionRecord = await Subscription.findOne({
      stripe_subscription_id: invoice.subscription
    });

    if (!subscriptionRecord) {
      return;
    }

    await logSubscriptionHistory({
      userId: subscriptionRecord.user_id,
      companyId: subscriptionRecord.company_id,
      action: 'updated',
      amount: invoice.amount_due,
      currency: invoice.currency,
      metadata: {
        stripe_invoice_id: invoice.id,
        upcoming_invoice: true,
        period_start: invoice.period_start,
        period_end: invoice.period_end,
      },
      stripeEventId: event.id,
    });

    console.log(`Upcoming invoice for subscription: ${subscriptionRecord.subscription_id}`);

  } catch (error) {
    console.error('Error handling upcoming invoice:', error);
    throw error;
  }
}

async function handleCustomerUpdated(event: any) {
  try {
    const customer = event.data.object;

    // Update user information if needed
    await User.findOneAndUpdate(
      { stripe_customer_id: customer.id },
      {
        // Update any customer-related fields if needed
        // email: customer.email, // Be careful about updating email
      }
    );

    console.log(`Customer updated: ${customer.id}`);

  } catch (error) {
    console.error('Error handling customer updated:', error);
    throw error;
  }
}

async function handlePaymentActionRequired(event: any) {
  try {
    const invoice = event.data.object;

    if (!invoice.subscription) {
      return;
    }

    const subscriptionRecord = await Subscription.findOne({
      stripe_subscription_id: invoice.subscription
    });

    if (!subscriptionRecord) {
      return;
    }

    await logSubscriptionHistory({
      userId: subscriptionRecord.user_id,
      companyId: subscriptionRecord.company_id,
      action: 'payment_action_required',
      newStatus: 'incomplete',
      amount: invoice.amount_due,
      currency: invoice.currency,
      metadata: {
        stripe_invoice_id: invoice.id,
        payment_intent_id: invoice.payment_intent,
        requires_action: true,
      },
      stripeEventId: event.id,
    });

    console.log(`Payment action required for subscription: ${subscriptionRecord.subscription_id}`);

  } catch (error) {
    console.error('Error handling payment action required:', error);
    throw error;
  }
}

async function handlePaymentMethodAttached(event: any) {
  try {
    const paymentMethod = event.data.object;

    if (paymentMethod.customer) {
      await User.findOneAndUpdate(
        { stripe_customer_id: paymentMethod.customer },
        { 
          payment_method_updated_at: new Date(),
        }
      );

      console.log(`Payment method attached for customer: ${paymentMethod.customer}`);
    }

  } catch (error) {
    console.error('Error handling payment method attached:', error);
    throw error;
  }
}

async function handleSubscriptionPaused(event: any) {
  try {
    const subscription = event.data.object;

    const user = await User.findOne({ subscription_id: subscription.id });
    if (!user) {
      console.error(`User not found for subscription ${subscription.id}`);
      return;
    }

    await User.findOneAndUpdate(
      { id: user.id },
      { subscription_status: 'paused' }
    );

    await Subscription.findOneAndUpdate(
      { stripe_subscription_id: subscription.id },
      { 
        status: 'paused',
        updated_at: new Date(),
      }
    );

    await logSubscriptionHistory({
      userId: user.id,
      companyId: user.company_id,
      action: 'paused',
      previousStatus: user.subscription_status,
      newStatus: 'paused',
      metadata: {
        stripe_subscription_id: subscription.id,
        pause_behavior: subscription.pause_collection?.behavior,
      },
      stripeEventId: event.id,
    });

    console.log(`Subscription paused: ${subscription.id}`);

  } catch (error) {
    console.error('Error handling subscription paused:', error);
    throw error;
  }
}

async function handleSubscriptionResumed(event: any) {
  try {
    const subscription = event.data.object;

    const user = await User.findOne({ subscription_id: subscription.id });
    if (!user) {
      console.error(`User not found for subscription ${subscription.id}`);
      return;
    }

    await User.findOneAndUpdate(
      { id: user.id },
      { subscription_status: 'active' }
    );

    await Subscription.findOneAndUpdate(
      { stripe_subscription_id: subscription.id },
      { 
        status: 'active',
        updated_at: new Date(),
      }
    );

    await logSubscriptionHistory({
      userId: user.id,
      companyId: user.company_id,
      action: 'resumed',
      previousStatus: 'paused',
      newStatus: 'active',
      metadata: {
        stripe_subscription_id: subscription.id,
        resumed_at: new Date().toISOString(),
      },
      stripeEventId: event.id,
    });

    console.log(`Subscription resumed: ${subscription.id}`);

  } catch (error) {
    console.error('Error handling subscription resumed:', error);
    throw error;
  }
}

// Helper function to log subscription history
async function logSubscriptionHistory(data: {
  userId: string;
  companyId: string;
  action: string;
  previousStatus?: string;
  newStatus?: string;
  previousPlan?: string;
  newPlan?: string;
  amount?: number;
  currency?: string;
  billingPeriod?: string;
  metadata?: any;
  stripeEventId: string;
}) {
  try {
    const history = new SubscriptionHistory({
      history_id: uuidv4(),
      user_id: data.userId,
      company_id: data.companyId,
      action: data.action,
      previous_status: data.previousStatus,
      new_status: data.newStatus,
      previous_plan: data.previousPlan,
      new_plan: data.newPlan,
      amount: data.amount,
      currency: data.currency || 'usd',
      billing_period: data.billingPeriod,
      metadata: data.metadata,
      stripe_event_id: data.stripeEventId,
    });

    await history.save();
  } catch (error) {
    console.error('Error logging subscription history:', error);
    // Don't throw here to avoid failing the webhook
  }
}