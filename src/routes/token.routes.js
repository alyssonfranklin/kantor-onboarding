/**
 * Token routes
 */
const express = require('express');
const {
  createToken,
  verifyToken,
  revokeToken,
  getUserTokens,
  cleanupTokens
} = require('../controllers/token.controller');
const { auth, isAdmin } = require('../middleware/auth');
const router = express.Router();

// Public route
router.get('/verify', verifyToken);           // Verify token validity

// Protected routes
router.post('/', auth, isAdmin, createToken);   // Create token (admin only)
router.post('/revoke', auth, revokeToken);      // Revoke token
router.get('/user/:userId', auth, getUserTokens); // Get user tokens
router.delete('/cleanup', auth, isAdmin, cleanupTokens); // Clean up expired tokens (admin only)

module.exports = router;