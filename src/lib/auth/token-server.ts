/**
 * Server-Side JWT Token Management
 * 
 * Provides utilities for handling JWT tokens
 * with support for token verification and generation.
 */

import jwt from 'jsonwebtoken';
import { TOKEN_EXPIRY } from './constants';

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