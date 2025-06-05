/**
 * Logout API Route
 * POST /api/v1/auth/logout
 * 
 * Handles user logout by invalidating tokens and clearing cookies
 */

import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import { invalidateToken } from '@/lib/mongodb/utils/jwt-utils';
import { clearAuthCookies } from '@/lib/auth/cookies';
import { getRequestCookie } from '@/lib/auth/cookies';
import { AUTH_TOKEN_NAME } from '@/lib/auth/constants';
import { withCsrfProtection } from '@/lib/auth/csrf';

export async function POST(req: NextRequest) {
  await dbConnect();
  
  try {
    // Get the token from the Authorization header or cookie
    const authHeader = req.headers.get('authorization');
    let token: string | undefined;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      token = getRequestCookie(req, AUTH_TOKEN_NAME);
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
    
    // Clear authentication cookies regardless of result
    clearAuthCookies(response);
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    
    // Still clear cookies even if there was an error
    const response = NextResponse.json(
      { success: false, message: 'An error occurred during logout' },
      { status: 500 }
    );
    
    clearAuthCookies(response);
    
    return response;
  }
}

// Apply CSRF protection to the route
export const POST_handler = withCsrfProtection(POST);