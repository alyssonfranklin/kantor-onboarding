/**
 * Cookie Management Utilities
 * 
 * Provides secure cookie handling for authentication tokens
 * with support for cross-domain scenarios.
 */

import { cookies } from 'next/headers';
import { ResponseCookies } from 'next/dist/compiled/@edge-runtime/cookies';
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

/**
 * Set a cookie in the browser
 */
export function setBrowserCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (typeof document === 'undefined') return;
  
  const optionsStr = Object.entries(options)
    .filter(([_, val]) => val !== undefined)
    .map(([key, val]) => {
      if (key === 'expires' && val instanceof Date) {
        return `${key}=${val.toUTCString()}`;
      }
      if (key === 'sameSite') {
        return `SameSite=${val}`;
      }
      if (typeof val === 'boolean') {
        return val ? key : '';
      }
      return `${key}=${val}`;
    })
    .filter(Boolean)
    .join('; ');
  
  document.cookie = `${name}=${value}${optionsStr ? '; ' + optionsStr : ''}`;
}

/**
 * Get a cookie in the browser
 */
export function getBrowserCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : undefined;
}

/**
 * Delete a cookie in the browser
 */
export function deleteBrowserCookie(name: string, options: CookieOptions = {}): void {
  if (typeof document === 'undefined') return;
  
  const { path, domain } = options;
  let cookieStr = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC`;
  
  if (path) cookieStr += `; path=${path}`;
  if (domain) cookieStr += `; domain=${domain}`;
  
  document.cookie = cookieStr;
}