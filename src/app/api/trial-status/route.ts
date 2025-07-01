import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { withAuth } from '@/lib/middleware/auth';
import { getTrialStatus, extendTrial } from '@/lib/stripe/trial-management';

// GET /api/trial-status - Get detailed trial status for the current user
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, { userId }) => {
    try {
      await connectToDatabase();

      const trialStatus = await getTrialStatus(userId);

      return NextResponse.json({
        success: true,
        data: trialStatus,
      });

    } catch (error: any) {
      console.error('Error fetching trial status:', error);

      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to fetch trial status',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      );
    }
  });
}

// POST /api/trial-status - Extend trial (if eligible)
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, { userId }) => {
    try {
      await connectToDatabase();

      const body = await request.json();
      const { action, additionalDays } = body;

      if (action === 'extend') {
        const days = additionalDays || 7;
        const success = await extendTrial(userId, days);

        if (success) {
          const updatedStatus = await getTrialStatus(userId);
          
          return NextResponse.json({
            success: true,
            message: `Trial extended by ${days} days`,
            data: updatedStatus,
          });
        } else {
          return NextResponse.json(
            { success: false, message: 'Trial extension not available' },
            { status: 400 }
          );
        }
      }

      return NextResponse.json(
        { success: false, message: 'Invalid action' },
        { status: 400 }
      );

    } catch (error: any) {
      console.error('Error processing trial request:', error);

      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to process trial request',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      );
    }
  });
}