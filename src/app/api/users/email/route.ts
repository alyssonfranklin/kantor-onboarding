import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import User from '@/lib/mongodb/models/user.model';

// CORS headers for cross-origin requests (needed for Google Apps Script)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Get user by email (public endpoint for Google Calendar integration)
 * GET /api/users/email?email=user@example.com
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    console.log('GET /api/users/email - Connected to MongoDB');
    
    // Get email from query parameters
    const url = new URL(req.url);
    const email = url.searchParams.get('email');
    
    if (!email) {
      console.log('GET /api/users/email - No email provided');
      return NextResponse.json(
        { success: false, message: 'Email parameter is required' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    console.log(`GET /api/users/email - Looking up user with email: ${email}`);
    
    // Find user by email
    const user = await User.findOne({ email }).select('-password');
    
    if (!user) {
      console.log(`GET /api/users/email - No user found with email: ${email}`);
      return NextResponse.json(
        { 
          success: false, 
          message: 'User not found',
          exists: false,
          accessGranted: false
        },
        { status: 404, headers: corsHeaders }
      );
    }
    
    console.log(`GET /api/users/email - Found user with ID: ${user.id}`);
    
    return NextResponse.json({
      success: true,
      data: user,
      exists: true,
      accessGranted: true
    }, {
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Error looking up user by email:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error looking up user',
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