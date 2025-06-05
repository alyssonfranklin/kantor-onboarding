/**
 * Password Reset Token Management
 * 
 * Re-exports from both server and client reset token utilities.
 * This file helps with backward compatibility.
 */

// Re-export the ResetTokenPayload type
export type { ResetTokenPayload } from './resetToken-server';

// Re-export server-side functions
export {
  generateResetToken,
  verifyResetToken,
  getResetTokenExpiry
} from './resetToken-server';

// Re-export client-side functions
export {
  createResetUrl
} from './resetToken-client';