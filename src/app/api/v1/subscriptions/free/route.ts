import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { connectToDatabase } from '@/lib/mongodb/connect';
import Subscription from '@/lib/mongodb/models/subscription.model';
import Company from '@/lib/mongodb/models/company.model';
import { v4 as uuidv4 } from 'uuid';

// POST /api/v1/subscriptions/free - Activate free plan
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, { userId, companyId }) => {
    try {
      await connectToDatabase();

      const body = await request.json();
      const { kantor_version } = body;

      if (!kantor_version) {
        return NextResponse.json(
          { success: false, message: 'kantor_version is required' },
          { status: 400 }
        );
      }

      // Check if company already has an active subscription
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

      // Create free subscription record
      const subscriptionId = uuidv4();
      const currentDate = new Date();
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(currentDate.getFullYear() + 1);

      const freeSubscription = new Subscription({
        subscription_id: subscriptionId,
        company_id: companyId,
        user_id: userId,
        kantor_version: kantor_version,
        status: 'active', // Free plans are immediately active
        current_period_start: currentDate,
        current_period_end: oneYearFromNow, // Free for a year
        billing_period: 'annual',
        amount: 0,
        currency: 'USD'
      });

      await freeSubscription.save();

      // Update company subscription status
      await Company.findOneAndUpdate(
        { company_id: companyId },
        { company_subscription: kantor_version }
      );

      return NextResponse.json({
        success: true,
        message: 'Free plan activated successfully',
        data: {
          subscription_id: subscriptionId,
          kantor_version: kantor_version,
          status: 'active',
          expires_at: oneYearFromNow
        }
      });

    } catch (error) {
      console.error('Error activating free plan:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to activate free plan' },
        { status: 500 }
      );
    }
  });
}