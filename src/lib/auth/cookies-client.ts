"use client";

/**
 * Client-Side Cookie Management Utilities
 * 
 * Provides cookie handling for authentication tokens in the browser.
 */

import { 
  AUTH_TOKEN_NAME, 
  REFRESH_TOKEN_NAME, 
  CSRF_TOKEN_NAME 
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

/**
 * Get auth token from browser cookie
 */
export function getAuthCookie(): string | undefined {
  return getBrowserCookie(AUTH_TOKEN_NAME);
}

/**
 * Get refresh token from browser cookie
 */
export function getRefreshCookie(): string | undefined {
  return getBrowserCookie(REFRESH_TOKEN_NAME);
}

/**
 * Get CSRF token from browser cookie
 */
export function getCsrfCookie(): string | undefined {
  return getBrowserCookie(CSRF_TOKEN_NAME);
}