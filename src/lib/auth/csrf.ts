/**
 * CSRF Protection
 * 
 * Provides utilities for Cross-Site Request Forgery protection
 * to secure form submissions and API calls across domains.
 */

import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { CSRF_TOKEN_NAME, CSRF_COOKIE_OPTIONS, TOKEN_EXPIRY } from './constants';
import { setCsrfCookie, getRequestCookie } from './cookies';

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
  
  // Body parsing for form submissions would happen here in a middleware
  
  // Compare tokens using constant-time comparison to prevent timing attacks
  return token && crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(cookieToken)
  );
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

/**
 * Client-side CSRF token utility for adding tokens to requests
 */
export const clientCsrf = {
  /**
   * Get the CSRF token from cookie for client-side use
   */
  getToken(): string | undefined {
    if (typeof document === 'undefined') return undefined;
    
    const cookies = document.cookie.split(';').map(c => c.trim());
    const csrfCookie = cookies.find(c => c.startsWith(`${CSRF_TOKEN_NAME}=`));
    return csrfCookie ? csrfCookie.split('=')[1] : undefined;
  },
  
  /**
   * Add CSRF token to fetch headers
   */
  addToHeaders(headers: HeadersInit = {}): Headers {
    const newHeaders = new Headers(headers);
    const token = this.getToken();
    
    if (token) {
      newHeaders.set('X-CSRF-Token', token);
    }
    
    return newHeaders;
  },
  
  /**
   * Add CSRF token to form data
   */
  addToFormData(formData: FormData): FormData {
    const token = this.getToken();
    if (token) {
      formData.append('_csrf', token);
    }
    return formData;
  },
  
  /**
   * Get a hidden input field with the CSRF token
   */
  hiddenField(): JSX.Element | null {
    if (typeof document === 'undefined') return null;
    
    const token = this.getToken();
    if (!token) return null;
    
    // We need to use React for this to be used in JSX
    const React = require('react');
    return React.createElement('input', {
      type: 'hidden',
      name: '_csrf',
      value: token
    });
  }
};