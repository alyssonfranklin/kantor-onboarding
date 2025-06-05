/**
 * Cookie Management Utilities
 * 
 * Re-exports from both server and client cookie utilities.
 * This file helps with backward compatibility and provides
 * a clean migration path.
 */

// Re-export server cookie utilities
export type { CookieOptions } from './cookies-server';
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

// Re-export client cookie utilities
export {
  setBrowserCookie,
  getBrowserCookie,
  deleteBrowserCookie,
  getAuthCookie,
  getRefreshCookie,
  getCsrfCookie
} from './cookies-client';