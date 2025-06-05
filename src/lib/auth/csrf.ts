/**
 * CSRF Protection
 * 
 * Re-exports from both server and client CSRF utilities.
 * This file helps with backward compatibility.
 */

// Re-export server-side CSRF functions
export {
  generateCsrfToken,
  createCsrfToken,
  generateServerCsrfToken,
  validateCsrfToken,
  withCsrfProtection
} from './csrf-server';

// Re-export client-side CSRF utilities
export { clientCsrf } from './csrf-client';