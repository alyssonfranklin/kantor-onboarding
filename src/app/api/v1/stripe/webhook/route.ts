import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe/config';
import { connectToDatabase } from '@/lib/mongodb/connect';
import Subscription from '@/lib/mongodb/models/subscription.model';
import Payment from '@/lib/mongodb/models/payment.model';
import Company from '@/lib/mongodb/models/company.model';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature || !STRIPE_CONFIG.webhookSecret) {
      return NextResponse.json(
        { error: 'Missing signature or webhook secret' },
        { status: 400 }
      );
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_CONFIG.webhookSecret);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log('Processing webhook event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: any) {
  try {
    const { metadata } = session;
    const { userId, companyId, kantor_version } = metadata;

    if (!userId || !companyId) {
      console.error('Missing metadata in checkout session');
      return;
    }

    // Get the subscription from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);

    // Update our subscription record
    await Subscription.findOneAndUpdate(
      { 
        company_id: companyId,
        status: 'incomplete'
      },
      {
        stripe_subscription_id: stripeSubscription.id,
        status: stripeSubscription.status === 'trialing' ? 'trial' : 'active',
        current_period_start: new Date(stripeSubscription.current_period_start * 1000),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000),
        amount: stripeSubscription.items.data[0]?.price.unit_amount || 0,
        updated_at: new Date()
      }
    );

    // Update company subscription status
    await Company.findOneAndUpdate(
      { company_id: companyId },
      { company_subscription: kantor_version }
    );

    console.log(`Checkout completed for company ${companyId}`);

  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

async function handleSubscriptionCreated(subscription: any) {
  try {
    const { metadata } = subscription;
    const { userId, companyId, kantor_version } = metadata;

    if (!userId || !companyId) {
      console.error('Missing metadata in subscription');
      return;
    }

    // Find and update existing subscription or create new one
    const existingSubscription = await Subscription.findOne({
      stripe_subscription_id: subscription.id
    });

    if (!existingSubscription) {
      // Create new subscription if it doesn't exist
      const newSubscription = new Subscription({
        subscription_id: uuidv4(),
        company_id: companyId,
        user_id: userId,
        kantor_version: kantor_version,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        status: subscription.status === 'trialing' ? 'trial' : subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000) : undefined,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
        billing_period: subscription.items.data[0]?.price.recurring?.interval === 'year' ? 'annual' : 'monthly',
        amount: subscription.items.data[0]?.price.unit_amount || 0,
        currency: subscription.currency
      });

      await newSubscription.save();
    }

    console.log(`Subscription created for company ${companyId}`);

  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  try {
    await Subscription.findOneAndUpdate(
      { stripe_subscription_id: subscription.id },
      {
        status: subscription.status === 'trialing' ? 'trial' : subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        amount: subscription.items.data[0]?.price.unit_amount || 0,
        updated_at: new Date()
      }
    );

    console.log(`Subscription updated: ${subscription.id}`);

  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  try {
    await Subscription.findOneAndUpdate(
      { stripe_subscription_id: subscription.id },
      {
        status: 'canceled',
        updated_at: new Date()
      }
    );

    console.log(`Subscription canceled: ${subscription.id}`);

  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

async function handlePaymentSucceeded(invoice: any) {
  try {
    if (!invoice.subscription) return;

    // Find the subscription
    const subscription = await Subscription.findOne({
      stripe_subscription_id: invoice.subscription
    });

    if (!subscription) {
      console.error('Subscription not found for invoice:', invoice.id);
      return;
    }

    // Create payment record
    const payment = new Payment({
      payment_id: uuidv4(),
      subscription_id: subscription.subscription_id,
      company_id: subscription.company_id,
      user_id: subscription.user_id,
      stripe_invoice_id: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'succeeded',
      payment_method: 'card', // Default, could be enhanced to detect actual method
      description: `Payment for ${subscription.kantor_version} plan`,
      paid_at: new Date(invoice.status_transitions.paid_at * 1000)
    });

    await payment.save();

    // Update subscription status to active if it was in trial
    if (subscription.status === 'trial') {
      await Subscription.findOneAndUpdate(
        { _id: subscription._id },
        { 
          status: 'active',
          updated_at: new Date()
        }
      );
    }

    console.log(`Payment succeeded for subscription: ${subscription.subscription_id}`);

  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

async function handlePaymentFailed(invoice: any) {
  try {
    if (!invoice.subscription) return;

    // Find the subscription
    const subscription = await Subscription.findOne({
      stripe_subscription_id: invoice.subscription
    });

    if (!subscription) {
      console.error('Subscription not found for invoice:', invoice.id);
      return;
    }

    // Create failed payment record
    const payment = new Payment({
      payment_id: uuidv4(),
      subscription_id: subscription.subscription_id,
      company_id: subscription.company_id,
      user_id: subscription.user_id,
      stripe_invoice_id: invoice.id,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: 'failed',
      payment_method: 'card',
      description: `Failed payment for ${subscription.kantor_version} plan`
    });

    await payment.save();

    // Update subscription status to past_due
    await Subscription.findOneAndUpdate(
      { _id: subscription._id },
      { 
        status: 'past_due',
        updated_at: new Date()
      }
    );

    console.log(`Payment failed for subscription: ${subscription.subscription_id}`);

  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}