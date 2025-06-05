/**
 * JWT Token Management
 * 
 * Provides utilities for handling JWT tokens across domains
 * with support for token verification, generation, and payload extraction.
 */

import jwt from 'jsonwebtoken';
import { AUTH_TOKEN_NAME, REFRESH_TOKEN_NAME, TOKEN_EXPIRY } from './constants';
import { getBrowserCookie } from './cookies';

// Get JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'voxerion_jwt_secret_key';

// JWT payload type
export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  company_id?: string;
  iat?: number;
  exp?: number;
}

/**
 * Generate a new JWT token
 */
export function generateToken(
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
  expiresIn = TOKEN_EXPIRY.AUTH
): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Generate a refresh token with longer expiry
 */
export function generateRefreshToken(
  payload: Omit<JwtPayload, 'iat' | 'exp'>
): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY.REFRESH });
}

/**
 * Verify a JWT token and return the decoded payload
 */
export function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Check if a token is valid (not expired and properly signed)
 */
export function isTokenValid(token: string): boolean {
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get token expiration time in seconds
 */
export function getTokenExpiration(token: string): number | null {
  try {
    const decoded = jwt.decode(token) as JwtPayload;
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
    const decoded = jwt.decode(token) as JwtPayload;
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
  if (typeof window === 'undefined') return undefined;
  return getBrowserCookie(AUTH_TOKEN_NAME);
}

/**
 * Get refresh token from browser (client-side only)
 */
export function getRefreshTokenFromBrowser(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return getBrowserCookie(REFRESH_TOKEN_NAME);
}

/**
 * Extract user data from a token
 */
export function getUserFromToken(token: string): Omit<JwtPayload, 'iat' | 'exp'> | null {
  try {
    const { id, email, role, company_id } = jwt.decode(token) as JwtPayload;
    return { id, email, role, company_id };
  } catch {
    return null;
  }
}