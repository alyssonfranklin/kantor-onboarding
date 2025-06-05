/**
 * Server-Side CSRF Protection
 * 
 * Provides utilities for Cross-Site Request Forgery protection
 * to secure form submissions and API calls across domains.
 * 
 * This file is only used on the server.
 */

import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { CSRF_TOKEN_NAME, CSRF_COOKIE_OPTIONS } from './constants';
import { setCsrfCookie, getRequestCookie } from './cookies-server';

/**
 * Generate a secure random token for CSRF protection
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a double-submit CSRF token and set it as a cookie in the response
 */
export function createCsrfToken(response: NextResponse): { csrfToken: string, response: NextResponse } {
  const csrfToken = generateCsrfToken();
  setCsrfCookie(response, csrfToken);
  return { csrfToken, response };
}

/**
 * Server-side CSRF token generation for forms
 * Returns a token to be included in forms as a hidden field
 */
export function generateServerCsrfToken(): string {
  const cookieStore = cookies();
  let csrfToken = cookieStore.get(CSRF_TOKEN_NAME)?.value;
  
  // If no token exists, create a new one
  if (!csrfToken) {
    csrfToken = generateCsrfToken();
    cookieStore.set(CSRF_TOKEN_NAME, csrfToken, CSRF_COOKIE_OPTIONS);
  }
  
  return csrfToken;
}

/**
 * Validate CSRF token - compares token in request with token in cookie
 */
export function validateCsrfToken(request: NextRequest, requestToken?: string): boolean {
  // Get token from cookie
  const cookieToken = getRequestCookie(request, CSRF_TOKEN_NAME);
  
  // If no cookie token, validation fails
  if (!cookieToken) return false;
  
  // Get token from request (header, body, or provided token)
  const token = requestToken || 
                request.headers.get('X-CSRF-Token') || 
                request.headers.get('x-csrf-token');
  
  // If no token, validation fails
  if (!token) return false;
  
  // Compare tokens using constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(cookieToken)
    );
  } catch (error) {
    // If tokens are different lengths, timingSafeEqual will throw
    return false;
  }
}

/**
 * CSRF protection middleware for API routes
 * This can be used to wrap route handlers that need CSRF protection
 */
export function withCsrfProtection(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse,
  options: { requireToken: boolean } = { requireToken: true }
) {
  return async (req: NextRequest) => {
    // Skip CSRF validation for non-mutation methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return handler(req);
    }
    
    // For mutation methods (POST, PUT, DELETE, etc.), validate CSRF token
    if (options.requireToken && !validateCsrfToken(req)) {
      return NextResponse.json(
        { success: false, message: 'Invalid CSRF token' },
        { status: 403 }
      );
    }
    
    return handler(req);
  };
}