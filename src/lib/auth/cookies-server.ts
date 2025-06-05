/**
 * Server-Side Cookie Management Utilities
 * 
 * Provides secure cookie handling for authentication tokens
 * with support for cross-domain scenarios.
 * 
 * This file is only used on the server.
 */

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { 
  AUTH_TOKEN_NAME, 
  REFRESH_TOKEN_NAME, 
  CSRF_TOKEN_NAME,
  AUTH_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
  CSRF_COOKIE_OPTIONS 
} from './constants';

/**
 * Type for cookie options
 */
export type CookieOptions = {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  path?: string;
  domain?: string;
  maxAge?: number;
  expires?: Date;
};

/**
 * Set a cookie on the server-side
 */
export function setServerCookie(
  name: string, 
  value: string, 
  options: CookieOptions = {}
): void {
  const cookieStore = cookies();
  cookieStore.set(name, value, options);
}

/**
 * Get a cookie on the server-side
 */
export function getServerCookie(name: string): string | undefined {
  const cookieStore = cookies();
  return cookieStore.get(name)?.value;
}

/**
 * Delete a cookie on the server-side
 */
export function deleteServerCookie(name: string, options: CookieOptions = {}): void {
  const cookieStore = cookies();
  cookieStore.set({
    name,
    value: '',
    ...options,
    expires: new Date(0),
    maxAge: 0,
  });
}

/**
 * Set a cookie in a response object
 */
export function setResponseCookie(
  response: NextResponse, 
  name: string, 
  value: string, 
  options: CookieOptions = {}
): NextResponse {
  response.cookies.set(name, value, options);
  return response;
}

/**
 * Delete a cookie from a response object
 */
export function deleteResponseCookie(
  response: NextResponse, 
  name: string, 
  options: CookieOptions = {}
): NextResponse {
  response.cookies.set({
    name,
    value: '',
    ...options,
    expires: new Date(0),
    maxAge: 0,
  });
  return response;
}

/**
 * Get a cookie from a request object
 */
export function getRequestCookie(request: NextRequest, name: string): string | undefined {
  return request.cookies.get(name)?.value;
}

/**
 * Set an authentication token as a cookie in a response
 */
export function setAuthCookie(response: NextResponse, token: string): NextResponse {
  return setResponseCookie(response, AUTH_TOKEN_NAME, token, AUTH_COOKIE_OPTIONS);
}

/**
 * Set a refresh token as a cookie in a response
 */
export function setRefreshCookie(response: NextResponse, token: string): NextResponse {
  return setResponseCookie(response, REFRESH_TOKEN_NAME, token, REFRESH_COOKIE_OPTIONS);
}

/**
 * Set a CSRF token as a cookie in a response
 */
export function setCsrfCookie(response: NextResponse, token: string): NextResponse {
  return setResponseCookie(response, CSRF_TOKEN_NAME, token, CSRF_COOKIE_OPTIONS);
}

/**
 * Delete all authentication cookies from a response
 */
export function clearAuthCookies(response: NextResponse): NextResponse {
  deleteResponseCookie(response, AUTH_TOKEN_NAME, AUTH_COOKIE_OPTIONS);
  deleteResponseCookie(response, REFRESH_TOKEN_NAME, REFRESH_COOKIE_OPTIONS);
  deleteResponseCookie(response, CSRF_TOKEN_NAME, CSRF_COOKIE_OPTIONS);
  return response;
}