/**
 * Token Refresh API Route
 * POST /api/v1/auth/refresh
 * 
 * Refreshes the authentication token and updates cookies
 */

import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import { verifyToken, isTokenValid, invalidateToken } from '@/lib/mongodb/utils/jwt-utils';
import { getRequestCookie } from '@/lib/auth/cookies';
import { 
  REFRESH_TOKEN_NAME, 
  AUTH_COOKIE_OPTIONS,
  AUTH_TOKEN_NAME
} from '@/lib/auth/constants';
import { setAuthCookie } from '@/lib/auth/cookies';
import { generateToken } from '@/lib/auth/token';
import { withCsrfProtection } from '@/lib/auth/csrf';
import User from '@/lib/mongodb/models/user.model';

export async function POST(req: NextRequest) {
  await dbConnect();
  
  try {
    // Get the refresh token from the cookie
    const refreshToken = getRequestCookie(req, REFRESH_TOKEN_NAME);
    
    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: 'No refresh token provided' },
        { status: 401 }
      );
    }
    
    // Verify refresh token format and signature
    const decoded = verifyToken(refreshToken);
    
    // Check if token exists in database
    const isValid = await isTokenValid(refreshToken);
    
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Refresh token has been invalidated' },
        { status: 401 }
      );
    }
    
    // Get user from database
    const user = await User.findOne({ id: decoded.id }).select('-password');
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 401 }
      );
    }
    
    // Invalidate the old auth token if present
    const oldAuthToken = getRequestCookie(req, AUTH_TOKEN_NAME);
    if (oldAuthToken) {
      await invalidateToken(oldAuthToken);
    }
    
    // Generate a new token
    const newToken = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      company_id: user.company_id
    });
    
    // Create response with new token
    const response = NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      token: newToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company_id: user.company_id
      }
    });
    
    // Set the new token as a cookie
    setAuthCookie(response, newToken);
    
    return response;
  } catch (error) {
    console.error('Token refresh error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Token refresh failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 401 }
    );
  }
}

// Apply CSRF protection to the route
export const POST_handler = withCsrfProtection(POST);