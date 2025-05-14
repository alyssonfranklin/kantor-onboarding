/**
 * Environment Configuration Utility
 * 
 * This module provides a type-safe, centralized way to access environment variables
 * with validation, default values, and environment-specific overrides.
 */

import { z } from 'zod';

/**
 * Environment Types
 */
export type Environment = 'development' | 'test' | 'production';

/**
 * Environment Validation Schema
 * Defines all required environment variables with their types
 */
const envSchema = z.object({
  // Application Environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform(val => parseInt(val, 10)).default('3000'),
  
  // URLs and Endpoints
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_BASE_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3000/api'),
  NEXT_PUBLIC_ASSETS_URL: z.string().url().default('http://localhost:3000'),
  
  // Authentication
  JWT_SECRET: z.string().min(10).default('voxerion_jwt_secret_key'),
  JWT_EXPIRY: z.string().default('7d'),
  JWT_REFRESH_EXPIRY: z.string().default('30d'),
  
  // Database
  MONGODB_URI: z.string().url().includes('mongodb'),
  
  // CORS Settings
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000')
    .transform(val => val.split(',').map(origin => origin.trim())),
  
  // Rate Limiting
  RATE_LIMIT_REQUESTS: z.string().transform(val => parseInt(val, 10)).default('100'),
  RATE_LIMIT_TIME: z.string().transform(val => parseInt(val, 10)).default('900000'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
  
  // Optional Services
  OPENAI_API_KEY: z.string().optional(),
  ANALYTICS_ID: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});

/**
 * Type definition for the validated environment
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Parse and validate the environment variables
 * @returns {Env} The validated environment object
 */
export function getEnv(): Env {
  try {
    // First collect all environment variables
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

    // Validate against the schema
    return envSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => err.path.join('.'));
      console.error('❌ Environment validation failed. Missing or invalid variables:', missingVars);
      throw new Error(`Environment validation failed: ${missingVars.join(', ')}`);
    }
    throw error;
  }
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
 * @returns {string} The base URL
 */
export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL as string || 
         (isProduction() ? 'https://app.voxerion.com' : 'http://localhost:3000');
}

/**
 * Get the API URL for the current environment
 * @returns {string} The API URL
 */
export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL as string || `${getBaseUrl()}/api`;
}

/**
 * Get the assets URL for the current environment
 * @returns {string} The assets URL
 */
export function getAssetsUrl(): string {
  return process.env.NEXT_PUBLIC_ASSETS_URL as string || getBaseUrl();
}

/**
 * Generate an absolute URL
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
 * @param {string} path - The asset path
 * @returns {string} The absolute asset URL
 */
export function getAssetUrl(path: string): string {
  const assetsUrl = getAssetsUrl();
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${assetsUrl}/${cleanPath}`;
}

// Export a singleton instance of the environment
const env = getEnv();
export default env;