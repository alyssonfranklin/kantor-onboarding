/**
 * Authentication Constants
 * 
 * This file contains constants and configuration for authentication and session management
 * that work across development and production environments.
 */

import { isProduction, isDevelopment } from '@/lib/environment';

// Domain Configuration
export const PRODUCTION_DOMAIN = 'voxerion.com';
export const PRODUCTION_APP_DOMAIN = 'app.voxerion.com';
export const DEV_DOMAIN = 'localhost';

// The root domain to use for cookies - in production this allows sharing between subdomains
export const ROOT_DOMAIN = isProduction() ? `.${PRODUCTION_DOMAIN}` : undefined;

// Authentication Token Settings
export const AUTH_TOKEN_NAME = 'auth_token';
export const CSRF_TOKEN_NAME = 'csrf_token';
export const REFRESH_TOKEN_NAME = 'refresh_token';

// Token expiry times (in seconds)
export const TOKEN_EXPIRY = {
  AUTH: 60 * 60 * 24 * 7, // 7 days
  REFRESH: 60 * 60 * 24 * 30, // 30 days
  CSRF: 60 * 60 * 3, // 3 hours
  REMEMBER_ME: 60 * 60 * 24 * 90, // 90 days
};

// Cookie Configuration
export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction(), // Secure in production, not in development
  sameSite: isProduction() ? 'none' as const : 'lax' as const,
  path: '/',
  domain: ROOT_DOMAIN,
  maxAge: TOKEN_EXPIRY.AUTH,
};

export const REFRESH_COOKIE_OPTIONS = {
  ...AUTH_COOKIE_OPTIONS,
  maxAge: TOKEN_EXPIRY.REFRESH,
  path: '/api/v1/auth/refresh', // Only sent to refresh endpoint
};

export const CSRF_COOKIE_OPTIONS = {
  httpOnly: false, // Must be accessible to JavaScript
  secure: isProduction(),
  sameSite: isProduction() ? 'none' as const : 'lax' as const,
  path: '/',
  domain: ROOT_DOMAIN,
  maxAge: TOKEN_EXPIRY.CSRF,
};

// Session Settings
export const SESSION_SETTINGS = {
  // Refresh token when this percentage of its lifetime has passed
  REFRESH_THRESHOLD: 0.7, // 70%
  
  // Automatic refresh interval in milliseconds (10 minutes)
  REFRESH_INTERVAL: 10 * 60 * 1000, 
  
  // How many failed refresh attempts before forcing logout
  MAX_REFRESH_ATTEMPTS: 3,
};

// URLs
export const AUTH_URLS = {
  LOGIN: '/api/v1/auth/login',
  LOGOUT: '/api/v1/auth/logout',
  REFRESH: '/api/v1/auth/refresh',
  VALIDATE: '/api/v1/auth/validate',
  CSRF: '/api/v1/auth/csrf',
  REQUEST_PASSWORD_RESET: '/api/v1/auth/reset-password/request'
};

// Local Storage Keys
export const STORAGE_KEYS = {
  REMEMBER_ME: 'voxerion_remember_me',
  LAST_ACTIVE: 'voxerion_last_active',
};

// Session events
export const SESSION_EVENTS = {
  LOGIN: 'voxerion:login',
  LOGOUT: 'voxerion:logout',
  EXPIRED: 'voxerion:session_expired',
  REFRESH: 'voxerion:token_refreshed',
  ERROR: 'voxerion:auth_error',
};