import jwt from 'jsonwebtoken';
import { IUser } from '../models/user.model';
import Token from '../models/token.model';
import { isProduction } from '@/lib/environment';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'voxerion_secret_key_change_in_production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

// Domain configuration for cookies
const ROOT_DOMAIN = 'voxerion.com';
const COOKIE_DOMAIN = isProduction() ? `.${ROOT_DOMAIN}` : undefined;

type JwtPayloadExtended = {
  id: string;
  email: string;
  role: string;
  company_id: string;
  iat?: number;
  exp?: number;
};

/**
 * Generate a JWT token for a user
 */
export const generateToken = async (user: IUser): Promise<string> => {
  try {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      company_id: user.company_id
    };

    const token = jwt.sign(payload, String(JWT_SECRET), { expiresIn: JWT_EXPIRY });
    
    // Calculate expiry date
    const expiryDays = parseInt(JWT_EXPIRY.replace('d', ''), 10);
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + expiryDays);
    
    // Store token in database
    await Token.create({
      token,
      user_id: user.id,
      expires_at: expiry
    });
    
    return token;
  } catch (error) {
    console.error('Error generating JWT token:', error);
    throw new Error('Failed to generate authentication token');
  }
};

/**
 * Set authentication cookie for cross-domain use
 */
export const setAuthCookie = (
  response: NextResponse, 
  token: string,
  options: {
    maxAge?: number;
    secure?: boolean;
    domain?: string;
  } = {}
): NextResponse => {
  const cookieOptions = {
    // Default to JWT expiry or 7 days if not specified
    maxAge: options.maxAge || parseInt(JWT_EXPIRY.replace('d', ''), 10) * 24 * 60 * 60,
    httpOnly: true,
    secure: options.secure ?? isProduction(),
    path: '/',
    sameSite: isProduction() ? 'none' as const : 'lax' as const,
    // In production, set domain to the root domain to allow sharing between subdomains
    ...(isProduction() && { domain: options.domain || COOKIE_DOMAIN }),
  };
  
  response.cookies.set('auth_token', token, cookieOptions);
  return response;
};

/**
 * Set authentication cookie in server action context
 */
export const setServerActionAuthCookie = (
  token: string,
  options: {
    maxAge?: number;
    secure?: boolean;
    domain?: string;
  } = {}
): void => {
  const cookieStore = cookies();
  const cookieOptions = {
    // Default to JWT expiry or 7 days if not specified
    maxAge: options.maxAge || parseInt(JWT_EXPIRY.replace('d', ''), 10) * 24 * 60 * 60,
    httpOnly: true,
    secure: options.secure ?? isProduction(),
    path: '/',
    sameSite: isProduction() ? 'none' as const : 'lax' as const,
    // In production, set domain to the root domain to allow sharing between subdomains
    ...(isProduction() && { domain: options.domain || COOKIE_DOMAIN }),
  };
  
  cookieStore.set('auth_token', token, cookieOptions);
};

/**
 * Clear authentication cookie
 */
export const clearAuthCookie = (response: NextResponse): NextResponse => {
  response.cookies.delete({
    name: 'auth_token',
    path: '/',
    domain: COOKIE_DOMAIN,
  });
  return response;
};

/**
 * Verify a JWT token
 */
export const verifyToken = (token: string): JwtPayloadExtended => {
  try {
    const decoded = jwt.verify(token, String(JWT_SECRET));
    return decoded as JwtPayloadExtended;
  } catch (error) {
    console.error('Error verifying JWT token:', error);
    throw new Error('Invalid or expired token');
  }
};

/**
 * Check if a token exists in the database
 */
export const isTokenValid = async (token: string): Promise<boolean> => {
  try {
    const storedToken = await Token.findOne({ token });
    return !!storedToken;
  } catch (error) {
    console.error('Error validating token in database:', error);
    return false;
  }
};

/**
 * Invalidate a token by removing it from the database
 */
export const invalidateToken = async (token: string): Promise<boolean> => {
  try {
    const result = await Token.deleteOne({ token });
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error invalidating token:', error);
    return false;
  }
};