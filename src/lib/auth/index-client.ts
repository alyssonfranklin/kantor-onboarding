"use client";

/**
 * Authentication Module - Client Side Exports
 * 
 * Client-safe exports for the authentication system
 */

// Export client-side constants
export * from './constants';

// Export client-side context
export { AuthContext, type AuthContextType } from './context';

// Export client-side cookie utilities
export {
  setBrowserCookie,
  getBrowserCookie,
  deleteBrowserCookie,
  getAuthCookie,
  getRefreshCookie,
  getCsrfCookie
} from './cookies-client';

// Export client-side CSRF utilities
export { clientCsrf } from './csrf-client';

// Export client-side hooks
export {
  useAuth,
  useLogin,
  useLogout,
  useRefreshToken,
  useSessionMonitor,
  useUser
} from './hooks';

// Export client-side session provider
export { SessionProvider } from './provider';

// Export client-side reset token utilities
export { createResetUrl } from './resetToken-client';

// Export client-side session utilities
export * from './session';

// Export client-side token utilities
export {
  getTokenExpiration,
  needsRefresh,
  getTokenFromBrowser,
  getRefreshTokenFromBrowser,
  getUserFromToken
} from './token-client';

// Default export is the SessionProvider
export { SessionProvider as default } from './provider';