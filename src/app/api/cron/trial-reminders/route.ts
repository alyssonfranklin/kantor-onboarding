import { NextRequest, NextResponse } from 'next/server';
import { checkAndSendTrialReminders, processTrialExpirations } from '@/lib/stripe/trial-management';

// This endpoint should be called by a cron job service (like Vercel Cron, GitHub Actions, or external cron)
// Security: Add API key authentication or restrict to specific IPs in production

export async function POST(request: NextRequest) {
  try {
    // Basic security check - verify the request comes from authorized source
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting scheduled trial management tasks...');

    // Run both trial reminder checks and expiration processing
    await Promise.all([
      checkAndSendTrialReminders(),
      processTrialExpirations(),
    ]);

    console.log('Trial management tasks completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Trial management tasks completed',
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Error in trial management cron job:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Trial management tasks failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'trial-reminders',
    timestamp: new Date().toISOString(),
  });
}