/**
 * Token controller for managing JWT tokens in the database
 */
const Token = require('../models/token.model');
const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');
const { success, error } = require('../utils/response');

/**
 * Create a new token record
 * @route POST /api/tokens
 * @access Private (admin only)
 */
const createToken = asyncHandler(async (req, res) => {
  const { token, user_id, expires_at } = req.body;
  
  if (!token || !user_id || !expires_at) {
    return error(res, 'All fields are required', 400);
  }
  
  try {
    // Check if token already exists
    const existingToken = await Token.findOne({ token });
    if (existingToken) {
      return error(res, 'Token already exists', 409);
    }
    
    // Create token record
    const newToken = await Token.create({
      token,
      user_id,
      expires_at: new Date(expires_at)
    });
    
    return success(res, {
      message: 'Token created successfully',
      token: newToken
    }, 201);
  } catch (err) {
    logger.error('Error creating token:', err);
    return error(res, 'Failed to create token', 500);
  }
});

/**
 * Verify if a token exists and is valid
 * @route GET /api/tokens/verify
 * @access Public
 */
const verifyToken = asyncHandler(async (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    return error(res, 'Token is required', 400);
  }
  
  try {
    // Find token in database
    const tokenDoc = await Token.findOne({ 
      token,
      revoked: false,
      expires_at: { $gt: new Date() }
    });
    
    if (!tokenDoc) {
      return error(res, 'Invalid or expired token', 401);
    }
    
    return success(res, {
      valid: true,
      user_id: tokenDoc.user_id,
      expires_at: tokenDoc.expires_at
    });
  } catch (err) {
    logger.error('Error verifying token:', err);
    return error(res, 'Failed to verify token', 500);
  }
});

/**
 * Revoke a token
 * @route POST /api/tokens/revoke
 * @access Private
 */
const revokeToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return error(res, 'Token is required', 400);
  }
  
  try {
    // Find token in database
    const tokenDoc = await Token.findOne({ token });
    
    if (!tokenDoc) {
      return error(res, 'Token not found', 404);
    }
    
    // Check if user has permission to revoke this token
    // Users can revoke their own tokens, admins can revoke any token
    const isAdmin = req.user.role === 'admin';
    const isOwnToken = req.user.id === tokenDoc.user_id;
    
    if (!isAdmin && !isOwnToken) {
      return error(res, 'You do not have permission to revoke this token', 403);
    }
    
    // Update token
    tokenDoc.revoked = true;
    tokenDoc.revoked_at = new Date();
    
    await tokenDoc.save();
    
    return success(res, {
      message: 'Token revoked successfully'
    });
  } catch (err) {
    logger.error('Error revoking token:', err);
    return error(res, 'Failed to revoke token', 500);
  }
});

/**
 * Get all tokens for a user
 * @route GET /api/tokens/user/:userId
 * @access Private
 */
const getUserTokens = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  try {
    // Check if user has permission to view these tokens
    const isAdmin = req.user.role === 'admin';
    const isOwnTokens = req.user.id === userId;
    
    if (!isAdmin && !isOwnTokens) {
      return error(res, 'You do not have permission to view these tokens', 403);
    }
    
    // Get tokens
    const tokens = await Token.find({ 
      user_id: userId,
      expires_at: { $gt: new Date() }
    }).sort({ createdAt: -1 });
    
    return success(res, { tokens });
  } catch (err) {
    logger.error(`Error getting tokens for user ${userId}:`, err);
    return error(res, 'Failed to get tokens', 500);
  }
});

/**
 * Clean up expired tokens (maintenance)
 * @route DELETE /api/tokens/cleanup
 * @access Private (admin only)
 */
const cleanupTokens = asyncHandler(async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return error(res, 'Only admins can perform token cleanup', 403);
  }
  
  try {
    // Delete expired tokens
    const result = await Token.deleteMany({
      $or: [
        { expires_at: { $lt: new Date() } },
        { revoked: true }
      ]
    });
    
    return success(res, {
      message: `Cleaned up ${result.deletedCount} expired or revoked tokens`
    });
  } catch (err) {
    logger.error('Error cleaning up tokens:', err);
    return error(res, 'Failed to clean up tokens', 500);
  }
});

module.exports = {
  createToken,
  verifyToken,
  revokeToken,
  getUserTokens,
  cleanupTokens
};