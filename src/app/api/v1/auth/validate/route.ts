/**
 * Token Validation API Route
 * GET /api/v1/auth/validate
 * 
 * Validates the current session token and returns user information
 */

import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import { verifyToken, isTokenValid } from '@/lib/mongodb/utils/jwt-utils';
import { getRequestCookie } from '@/lib/auth/cookies';
import { AUTH_TOKEN_NAME } from '@/lib/auth/constants';
import User from '@/lib/mongodb/models/user.model';

export async function GET(req: NextRequest) {
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
        { status: 401 }
      );
    }
    
    // Verify token format and signature
    const decoded = verifyToken(token);
    
    // Check if token exists in database
    const isValid = await isTokenValid(token);
    
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Token has been invalidated' },
        { status: 401 }
      );
    }
    
    // Get user from database to ensure they still exist and are active
    const user = await User.findOne({ id: decoded.id }).select('-password');
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 401 }
      );
    }
    
    // Return success with user data
    return NextResponse.json({
      success: true,
      message: 'Token is valid',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company_id: user.company_id
      }
    });
  } catch (error) {
    console.error('Token validation error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Authentication failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 401 }
    );
  }
}