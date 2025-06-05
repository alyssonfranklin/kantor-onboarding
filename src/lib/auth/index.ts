/**
 * Authentication Module
 * 
 * Main entry point for the authentication system
 * with exports for all authentication functionality.
 */

// Export all authentication components and utilities
export * from './constants';
export * from './context';
export * from './cookies';
export * from './csrf';
export * from './hooks';
export * from './provider';
export * from './resetToken';
export * from './session';
export * from './token';

// Default export is the SessionProvider
export { SessionProvider as default } from './provider';