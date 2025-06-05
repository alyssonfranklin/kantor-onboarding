import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import { invalidateToken, clearAuthCookie } from '@/lib/mongodb/utils/jwt-utils';

/**
 * Logout API endpoint
 * POST /api/v1/logout
 */
export async function POST(req: NextRequest) {
  await dbConnect();
  
  try {
    // Get the token from the Authorization header or cookie
    const authHeader = req.headers.get('authorization');
    const tokenFromCookie = req.cookies.get('auth_token')?.value;
    
    let token: string | undefined;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (tokenFromCookie) {
      token = tokenFromCookie;
    }
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No authentication token provided' },
        { status: 400 }
      );
    }
    
    // Invalidate the token in the database
    const result = await invalidateToken(token);
    
    let response;
    
    if (result) {
      response = NextResponse.json({
        success: true,
        message: 'Logged out successfully'
      });
    } else {
      response = NextResponse.json(
        { success: false, message: 'Token not found or already invalidated' },
        { status: 400 }
      );
    }
    
    // Clear the authentication cookie even if the token was already invalidated
    clearAuthCookie(response);
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    
    // Still need to clear the cookie even if there was an error
    const response = NextResponse.json(
      { success: false, message: 'An error occurred during logout' },
      { status: 500 }
    );
    
    clearAuthCookie(response);
    
    return response;
  }
}