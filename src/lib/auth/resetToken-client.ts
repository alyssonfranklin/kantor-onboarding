"use client";

/**
 * Client-Side Password Reset Token Management
 * 
 * Client-side utilities for handling password reset tokens.
 */

// Re-export the payload type for type consistency
export interface ResetTokenPayload {
  email: string;
  id: string;
  purpose: 'password_reset';
  nonce: string;
}

// Token expiry time (5 minutes)
const RESET_TOKEN_EXPIRY = 60 * 5; // 5 minutes in seconds

/**
 * Get the expiration time of a reset token in seconds
 * @returns Expiration time in seconds
 */
export function getResetTokenExpiry(): number {
  return RESET_TOKEN_EXPIRY;
}

/**
 * Create a reset URL from a token
 * @param token Reset token
 * @param baseUrl Base URL (optional, defaults to current origin)
 * @returns Complete reset URL
 */
export function createResetUrl(token: string, baseUrl?: string): string {
  const base = baseUrl || window.location.origin;
  return `${base}/reset-password?token=${encodeURIComponent(token)}`;
}