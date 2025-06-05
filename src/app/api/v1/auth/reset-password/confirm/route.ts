/**
 * Password Reset Confirmation API Route
 * POST /api/v1/auth/reset-password/confirm
 * 
 * Validates the reset token and sets a new password.
 */

import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import User from '@/lib/mongodb/models/user.model';
import { verifyResetToken } from '@/lib/auth/resetToken';
import { withCsrfProtection } from '@/lib/auth/csrf';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  await dbConnect();
  
  try {
    const body = await req.json();
    
    // Validate required fields
    if (!body.token || !body.password) {
      return NextResponse.json(
        { success: false, message: 'Token and new password are required' },
        { status: 400 }
      );
    }
    
    // Validate password strength
    if (body.password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }
    
    // Verify token
    const decodedToken = verifyResetToken(body.token);
    
    if (!decodedToken) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }
    
    // Find user by ID from token
    const user = await User.findOne({ id: decodedToken.id });
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Verify email matches
    if (user.email !== decodedToken.email) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 400 }
      );
    }
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(body.password, salt);
    
    // Update the user's password
    user.password = hashedPassword;
    await user.save();
    
    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Password reset confirmation error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to reset password',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Apply CSRF protection to the route
export const POST_handler = withCsrfProtection(POST);