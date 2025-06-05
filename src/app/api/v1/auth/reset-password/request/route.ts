/**
 * Password Reset Request API Route
 * POST /api/v1/auth/reset-password/request
 * 
 * Initiates the password reset process by generating
 * a time-limited token and sending it via email.
 */

import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import User from '@/lib/mongodb/models/user.model';
import { generateResetToken, getResetTokenExpiry } from '@/lib/auth/index-server';
import { createResetUrl } from '@/lib/auth/resetToken-client';
import { withCsrfProtection } from '@/lib/auth/index-server';
import { getBaseUrl } from '@/lib/environment';

export async function POST(req: NextRequest) {
  await dbConnect();
  
  try {
    const body = await req.json();
    
    // Validate email
    if (!body.email || typeof body.email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }
    
    const email = body.email.trim().toLowerCase();
    
    // Find user by email
    const user = await User.findOne({ email });
    
    // For security reasons, don't reveal if the email exists or not
    // Always return success even if user not found
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      
      return NextResponse.json({
        success: true,
        message: 'If the email exists, password reset instructions will be sent'
      });
    }
    
    // Generate reset token
    const resetToken = generateResetToken(user.id, user.email);
    
    // Create reset URL
    const baseUrl = getBaseUrl();
    const resetUrl = createResetUrl(resetToken, baseUrl);
    
    // Get token expiry in minutes
    const expiryMinutes = Math.floor(getResetTokenExpiry() / 60);
    
    // TODO: In a real implementation, send an email with the reset link
    // For now, we'll just log it to the console
    console.log(`
      Password reset requested for: ${email}
      Reset URL: ${resetUrl}
      This link will expire in ${expiryMinutes} minutes.
    `);
    
    // In a real-world scenario, you would use an email service like SendGrid, Mailgun, etc.
    // For example:
    // await sendEmail({
    //   to: email,
    //   subject: 'Reset your Voxerion password',
    //   html: `
    //     <h1>Reset Your Password</h1>
    //     <p>You requested a password reset for your Voxerion account.</p>
    //     <p>Click the link below to reset your password. This link will expire in ${expiryMinutes} minutes.</p>
    //     <a href="${resetUrl}">Reset Password</a>
    //   `
    // });
    
    return NextResponse.json({
      success: true,
      message: 'If the email exists, password reset instructions will be sent',
      // Include the URL in development for testing
      ...(process.env.NODE_ENV === 'development' && { resetUrl })
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to process password reset request',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Apply CSRF protection to the route
export const POST_handler = withCsrfProtection(POST);