/**
 * Server-Side Password Reset Token Management
 * 
 * Provides utilities for generating and validating time-limited
 * password reset tokens.
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// Secret for signing password reset tokens
// Using JWT_SECRET with a prefix to differentiate from auth tokens
const RESET_TOKEN_SECRET = process.env.JWT_SECRET ? 
  `pwd_reset_${process.env.JWT_SECRET}` : 
  'pwd_reset_voxerion_secret_key_change_in_production';

// Token expiry time (5 minutes)
const RESET_TOKEN_EXPIRY = 60 * 5; // 5 minutes in seconds

/**
 * Interface for reset token payload
 */
export interface ResetTokenPayload {
  email: string;
  id: string;
  purpose: 'password_reset';
  nonce: string;
}

/**
 * Generate a password reset token
 * @param userId User ID
 * @param email User email
 * @returns JWT token string that expires in 5 minutes
 */
export function generateResetToken(userId: string, email: string): string {
  // Generate a random nonce to ensure uniqueness
  const nonce = crypto.randomBytes(16).toString('hex');
  
  // Create token payload
  const payload: ResetTokenPayload = {
    id: userId,
    email,
    purpose: 'password_reset',
    nonce
  };
  
  // Sign the token with 5-minute expiry
  return jwt.sign(payload, RESET_TOKEN_SECRET, { 
    expiresIn: RESET_TOKEN_EXPIRY 
  });
}

/**
 * Verify a password reset token
 * @param token Reset token to verify
 * @returns Decoded token payload if valid, null if invalid
 */
export function verifyResetToken(token: string): ResetTokenPayload | null {
  try {
    // Verify token signature and expiration
    const decoded = jwt.verify(token, RESET_TOKEN_SECRET) as ResetTokenPayload;
    
    // Ensure this is a password reset token
    if (decoded.purpose !== 'password_reset') {
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('Error verifying reset token:', error);
    return null;
  }
}

/**
 * Get the expiration time of a reset token in seconds
 * @returns Expiration time in seconds
 */
export function getResetTokenExpiry(): number {
  return RESET_TOKEN_EXPIRY;
}