/**
 * Environment Configuration Utility
 * 
 * This module provides a type-safe, centralized way to access environment variables
 * with validation, default values, and environment-specific overrides.
 * It handles both client-side and server-side environments appropriately.
 */

import { z } from 'zod';

/**
 * Environment Types
 */
export type Environment = 'development' | 'test' | 'production';

/**
 * Detect if code is running on the server or client
 * @returns {boolean} True if running on the server
 */
export const isServer = typeof window === 'undefined';

/**
 * Client-Safe Environment Validation Schema
 * Only includes variables that are safe to use on the client-side (NEXT_PUBLIC_*)
 */
const clientEnvSchema = z.object({
  // Application Environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Public URLs and Endpoints (safe for client)
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_BASE_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3000/api'),
  NEXT_PUBLIC_ASSETS_URL: z.string().url().default('http://localhost:3000'),
  
  // Optional client-safe services
  ANALYTICS_ID: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});

/**
 * Server-Side Environment Validation Schema
 * Includes all environment variables, including server-only ones
 */
const serverEnvSchema = clientEnvSchema.extend({
  // Server-only configuration
  PORT: z.string().transform(val => parseInt(val, 10)).default('3000'),
  
  // Authentication (server-only)
  JWT_SECRET: z.string().min(10).default('voxerion_jwt_secret_key'),
  JWT_EXPIRY: z.string().default('7d'),
  JWT_REFRESH_EXPIRY: z.string().default('30d'),
  
  // Database (server-only)
  MONGODB_URI: z.string().url().includes('mongodb'),
  
  // CORS Settings (server-only)
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000')
    .transform(val => val.split(',').map(origin => origin.trim())),
  
  // Rate Limiting (server-only)
  RATE_LIMIT_REQUESTS: z.string().transform(val => parseInt(val, 10)).default('100'),
  RATE_LIMIT_TIME: z.string().transform(val => parseInt(val, 10)).default('900000'),
  
  // Logging (server-only)
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
  
  // Optional Services (server-only)
  OPENAI_API_KEY: z.string().optional(),
});

/**
 * Type definitions for validated environments
 */
export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type Env = ServerEnv; // For backward compatibility

/**
 * Parse and validate the client environment variables
 * @returns {ClientEnv} The validated client environment object
 */
export function getClientEnv(): ClientEnv {
  try {
    // Collect client-safe environment variables
    const env = {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_ASSETS_URL: process.env.NEXT_PUBLIC_ASSETS_URL,
      ANALYTICS_ID: process.env.ANALYTICS_ID,
      SENTRY_DSN: process.env.SENTRY_DSN,
    };

    // Validate against the client schema
    return clientEnvSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => err.path.join('.'));
      console.error('❌ Client environment validation failed. Missing or invalid variables:', missingVars);
      throw new Error(`Client environment validation failed: ${missingVars.join(', ')}`);
    }
    throw error;
  }
}

/**
 * Parse and validate all environment variables (server-side only)
 * @returns {ServerEnv} The validated server environment object
 */
export function getServerEnv(): ServerEnv {
  if (!isServer) {
    console.warn('Attempting to access server environment variables on the client side');
    throw new Error('Server environment variables are not available on the client side');
  }

  try {
    // Collect all environment variables
    const env = {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_ASSETS_URL: process.env.NEXT_PUBLIC_ASSETS_URL,
      JWT_SECRET: process.env.JWT_SECRET,
      JWT_EXPIRY: process.env.JWT_EXPIRY,
      JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY,
      MONGODB_URI: process.env.MONGODB_URI,
      ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
      RATE_LIMIT_REQUESTS: process.env.RATE_LIMIT_REQUESTS,
      RATE_LIMIT_TIME: process.env.RATE_LIMIT_TIME,
      LOG_LEVEL: process.env.LOG_LEVEL,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      ANALYTICS_ID: process.env.ANALYTICS_ID,
      SENTRY_DSN: process.env.SENTRY_DSN,
    };

    // Validate against the server schema
    return serverEnvSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => err.path.join('.'));
      console.error('❌ Server environment validation failed. Missing or invalid variables:', missingVars);
      throw new Error(`Server environment validation failed: ${missingVars.join(', ')}`);
    }
    throw error;
  }
}

/**
 * Get the appropriate environment based on runtime context
 * @returns {ClientEnv | ServerEnv} Environment variables appropriate for the current context
 */
export function getEnv(): ClientEnv | ServerEnv {
  return isServer ? getServerEnv() : getClientEnv();
}

/**
 * Get the current environment
 * @returns {Environment} The current environment (development, test, or production)
 */
export function getEnvironment(): Environment {
  return (process.env.NODE_ENV as Environment) || 'development';
}

/**
 * Check if the current environment is development
 * @returns {boolean} True if in development environment
 */
export function isDevelopment(): boolean {
  return getEnvironment() === 'development';
}

/**
 * Check if the current environment is production
 * @returns {boolean} True if in production environment
 */
export function isProduction(): boolean {
  return getEnvironment() === 'production';
}

/**
 * Check if the current environment is test
 * @returns {boolean} True if in test environment
 */
export function isTest(): boolean {
  return getEnvironment() === 'test';
}

/**
 * Get the appropriate base URL for the current environment
 * Safe for both client and server
 * @returns {string} The base URL
 */
export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL as string || 
         (isProduction() ? 'https://app.voxerion.com' : 'http://localhost:3000');
}

/**
 * Get the API URL for the current environment
 * Safe for both client and server
 * @returns {string} The API URL
 */
export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL as string || `${getBaseUrl()}/api`;
}

/**
 * Get the assets URL for the current environment
 * Safe for both client and server
 * @returns {string} The assets URL
 */
export function getAssetsUrl(): string {
  return process.env.NEXT_PUBLIC_ASSETS_URL as string || getBaseUrl();
}

/**
 * Generate an absolute URL
 * Safe for both client and server
 * @param {string} path - The relative path
 * @returns {string} The absolute URL
 */
export function getAbsoluteUrl(path: string): string {
  const baseUrl = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Generate an absolute API URL
 * Safe for both client and server
 * @param {string} path - The relative API path
 * @returns {string} The absolute API URL
 */
export function getAbsoluteApiUrl(path: string): string {
  const apiUrl = getApiUrl();
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${apiUrl}/${cleanPath}`;
}

/**
 * Get an asset URL
 * Safe for both client and server
 * @param {string} path - The asset path
 * @returns {string} The absolute asset URL
 */
export function getAssetUrl(path: string): string {
  const assetsUrl = getAssetsUrl();
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${assetsUrl}/${cleanPath}`;
}

// Export a singleton instance of the environment appropriate for the runtime context
const env = getEnv();
export default env;