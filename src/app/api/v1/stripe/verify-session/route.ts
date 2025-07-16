import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { dbConnect } from '@/lib/mongodb/connect';
import Subscription from '@/lib/mongodb/models/subscription.model';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription']
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session not found' },
        { status: 404 }
      );
    }

    // Get subscription details from our database
    const subscription = await Subscription.findOne({
      stripe_subscription_id: session.subscription
    }).lean();

    if (!subscription) {
      return NextResponse.json(
        { success: false, message: 'Subscription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        payment_status: session.payment_status,
        customer_email: session.customer_details?.email
      },
      subscription: {
        subscription_id: subscription.subscription_id,
        kantor_version: subscription.kantor_version,
        status: subscription.status,
        billing_period: subscription.billing_period,
        trial_end: subscription.trial_end,
        current_period_end: subscription.current_period_end,
        amount: subscription.amount,
        currency: subscription.currency
      }
    });

  } catch (error) {
    console.error('Error verifying session:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to verify session' },
      { status: 500 }
    );
  }
}