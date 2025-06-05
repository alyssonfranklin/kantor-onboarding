"use client";

/**
 * Client-Side JWT Token Management
 * 
 * Provides utilities for handling JWT tokens in the browser
 * with support for token expiration checking and user data extraction.
 */

import { AUTH_TOKEN_NAME, REFRESH_TOKEN_NAME } from './constants';
import { getBrowserCookie } from './cookies-client';

// JWT payload type (imported from server to maintain type consistency)
export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  company_id?: string;
  iat?: number;
  exp?: number;
}

/**
 * Get token expiration time in seconds
 */
export function getTokenExpiration(token: string): number | null {
  try {
    // Use native JSON parsing since we're in the browser
    const decoded = JSON.parse(atob(token.split('.')[1])) as JwtPayload;
    return decoded.exp || null;
  } catch {
    return null;
  }
}

/**
 * Check if a token needs to be refreshed based on expiration time
 * Returns true if the token has passed the refresh threshold
 */
export function needsRefresh(token: string, thresholdPercentage = 0.7): boolean {
  try {
    // Use native JSON parsing since we're in the browser
    const decoded = JSON.parse(atob(token.split('.')[1])) as JwtPayload;
    if (!decoded.exp || !decoded.iat) return false;
    
    const now = Math.floor(Date.now() / 1000);
    const totalLifetime = decoded.exp - decoded.iat;
    const thresholdTime = decoded.iat + (totalLifetime * thresholdPercentage);
    
    return now >= thresholdTime;
  } catch {
    return false;
  }
}

/**
 * Get token from browser (client-side only)
 */
export function getTokenFromBrowser(): string | undefined {
  return getBrowserCookie(AUTH_TOKEN_NAME);
}

/**
 * Get refresh token from browser (client-side only)
 */
export function getRefreshTokenFromBrowser(): string | undefined {
  return getBrowserCookie(REFRESH_TOKEN_NAME);
}

/**
 * Extract user data from a token
 */
export function getUserFromToken(token: string): Omit<JwtPayload, 'iat' | 'exp'> | null {
  try {
    // Use native JSON parsing since we're in the browser
    const decoded = JSON.parse(atob(token.split('.')[1])) as JwtPayload;
    const { id, email, role, company_id } = decoded;
    return { id, email, role, company_id };
  } catch {
    return null;
  }
}