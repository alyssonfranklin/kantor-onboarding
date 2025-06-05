/**
 * Password Reset Token Verification API Route
 * GET /api/v1/auth/reset-password/verify?token=xyz
 * 
 * Validates a reset token without consuming it.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyResetToken } from '@/lib/auth/resetToken';

export async function GET(req: NextRequest) {
  try {
    // Get token from query parameters
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token is required' },
        { status: 400 }
      );
    }
    
    // Verify token
    const decodedToken = verifyResetToken(token);
    
    if (!decodedToken) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }
    
    // Return user email from token (for UI display)
    return NextResponse.json({
      success: true,
      message: 'Token is valid',
      email: decodedToken.email
    });
  } catch (error) {
    console.error('Token verification error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to verify token',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}