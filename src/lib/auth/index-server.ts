/**
 * Authentication Module - Server Side Exports
 * 
 * Server-only exports for the authentication system
 */

// Export server-side constants
export * from './constants';

// Export server-side cookie utilities
export {
  setServerCookie,
  getServerCookie,
  deleteServerCookie,
  setResponseCookie,
  deleteResponseCookie,
  getRequestCookie,
  setAuthCookie,
  setRefreshCookie,
  setCsrfCookie,
  clearAuthCookies
} from './cookies-server';

// Export server-side CSRF utilities
export {
  generateCsrfToken,
  createCsrfToken,
  generateServerCsrfToken,
  validateCsrfToken,
  withCsrfProtection
} from './csrf-server';

// Export server-side reset token utilities
export {
  generateResetToken,
  verifyResetToken,
  getResetTokenExpiry
} from './resetToken-server';

// Export server-side token utilities
export {
  generateToken,
  generateRefreshToken,
  verifyToken,
  isTokenValid
} from './token-server';