/**
 * User routes
 */
const express = require('express');
const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  loginUser,
  logoutUser
} = require('../controllers/user.controller');
const { auth, isAdmin, isOrgAdmin } = require('../middleware/auth');
const router = express.Router();

// Public routes
router.post('/login', loginUser);
router.post('/', createUser);      // signup/register

// Protected routes
router.get('/', auth, getUsers);     // Get all users (filtered by permissions)
router.get('/:id', auth, getUserById);     // Get user by ID
router.put('/:id', auth, updateUser);      // Update user (self or admin)
router.delete('/:id', auth, deleteUser);   // Delete user (admin only)
router.post('/logout', auth, logoutUser);  // Logout

module.exports = router;