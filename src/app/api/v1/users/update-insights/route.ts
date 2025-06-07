import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import User from '@/lib/mongodb/models/user.model';

// CORS headers for cross-origin requests (needed for Google Apps Script)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Update user insights count (public endpoint for Google Calendar integration)
 * This endpoint is specifically for decrementing the insightsLeft count
 * It doesn't require authentication for the Google Calendar integration
 * 
 * POST /api/v1/users/update-insights
 * Body: { email: string, insightsLeft: number }
 */
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    console.log('POST /api/v1/users/update-insights - Connected to MongoDB');
    
    // Parse request body
    const body = await req.json();
    const { email, insightsLeft } = body;
    
    // Validate required fields
    if (!email) {
      console.log('POST /api/v1/users/update-insights - No email provided');
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (typeof insightsLeft !== 'number') {
      console.log('POST /api/v1/users/update-insights - Invalid insightsLeft value');
      return NextResponse.json(
        { success: false, message: 'insightsLeft must be a number' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    console.log(`POST /api/v1/users/update-insights - Updating insights count for user: ${email} to ${insightsLeft}`);
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`POST /api/v1/users/update-insights - No user found with email: ${email}`);
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404, headers: corsHeaders }
      );
    }
    
    // Update user's insightsLeft field using updateOne to avoid validation issues
    const updateResult = await User.updateOne(
      { email },
      { $set: { insightsLeft } }
    );
    
    if (updateResult.modifiedCount === 0) {
      console.log(`POST /api/v1/users/update-insights - Failed to update user: ${email}`);
      return NextResponse.json(
        { success: false, message: 'Failed to update insights count' },
        { status: 500, headers: corsHeaders }
      );
    }
    
    console.log(`POST /api/v1/users/update-insights - Successfully updated insights count for user ${email} to ${insightsLeft}`);
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Insights count updated successfully',
      data: {
        id: user.id,
        email: user.email,
        insightsLeft: insightsLeft // Use the value we set since we didn't reload the user
      }
    }, {
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error('Error updating insights count:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error updating insights count',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * GET method for compatibility with Google Apps Script
 * GET /api/v1/users/update-insights?email=user@example.com&count=10
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    console.log('GET /api/v1/users/update-insights - Connected to MongoDB');
    
    // Get parameters from URL
    const url = new URL(req.url);
    const email = url.searchParams.get('email');
    const countStr = url.searchParams.get('count');
    
    // Validate required parameters
    if (!email) {
      console.log('GET /api/v1/users/update-insights - No email provided');
      return NextResponse.json(
        { success: false, message: 'Email parameter is required' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    if (!countStr) {
      console.log('GET /api/v1/users/update-insights - No count provided');
      return NextResponse.json(
        { success: false, message: 'Count parameter is required' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Parse count to number
    const insightsLeft = parseInt(countStr, 10);
    
    if (isNaN(insightsLeft)) {
      console.log('GET /api/v1/users/update-insights - Invalid count value');
      return NextResponse.json(
        { success: false, message: 'Count must be a number' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    console.log(`GET /api/v1/users/update-insights - Updating insights count for user: ${email} to ${insightsLeft}`);
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`GET /api/v1/users/update-insights - No user found with email: ${email}`);
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404, headers: corsHeaders }
      );
    }
    
    // Update user's insightsLeft field using updateOne to avoid validation issues
    const updateResult = await User.updateOne(
      { email },
      { $set: { insightsLeft } }
    );
    
    if (updateResult.modifiedCount === 0) {
      console.log(`GET /api/v1/users/update-insights - Failed to update user: ${email}`);
      return NextResponse.json(
        { success: false, message: 'Failed to update insights count' },
        { status: 500, headers: corsHeaders }
      );
    }
    
    console.log(`GET /api/v1/users/update-insights - Successfully updated insights count for user ${email} to ${insightsLeft}`);
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Insights count updated successfully',
      data: {
        id: user.id,
        email: user.email,
        insightsLeft: insightsLeft // Use the value we set since we didn't reload the user
      }
    }, {
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error('Error updating insights count:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error updating insights count',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}