/**
 * JWT Token Management
 * 
 * Re-exports from both server and client token utilities.
 * This file helps with backward compatibility.
 */

// Re-export the JwtPayload type
export type { JwtPayload } from './token-server';

// Re-export server-side token functions
export {
  generateToken,
  generateRefreshToken,
  verifyToken,
  isTokenValid
} from './token-server';

// Re-export client-side token functions
export {
  getTokenExpiration,
  needsRefresh,
  getTokenFromBrowser,
  getRefreshTokenFromBrowser,
  getUserFromToken
} from './token-client';