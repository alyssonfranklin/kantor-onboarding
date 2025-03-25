import express from 'express';
import { 
  createUser, 
  getUserById, 
  getUserByEmail, 
  getUsersByCompany, 
  updateUser, 
  deleteUser 
} from '../models/user.model';
import { authenticate, requireAdmin, requireCompanyAccess } from '../middleware/auth.middleware';
import logger from '../config/logger';
import { z } from 'zod';

const router = express.Router();

// User creation validation schema
const userCreateSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  company_id: z.string().min(1, { message: "Company ID is required" }),
  role: z.string().min(1, { message: "Role is required" }),
  department: z.string().min(1, { message: "Department is required" }),
  company_role: z.string().min(1, { message: "Company role is required" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" })
});

// User update validation schema
const userUpdateSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }).optional(),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }).optional(),
  role: z.string().optional(),
  department: z.string().optional(),
  company_role: z.string().optional(),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).optional()
});

/**
 * Create a new user
 * POST /api/users
 */
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    // Validate request body
    const validation = userCreateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: validation.error.format() 
      });
    }

    // Check if requesting user has access to the company
    if (req.user?.company_id !== req.body.company_id && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to add users to this company' });
    }
    
    // Check if email already exists
    const existingUser = await getUserByEmail(req.body.email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    
    // Create new user
    const newUser = await createUser(req.body);
    
    // Return user without password
    const { password, ...userWithoutPassword } = newUser;
    
    return res.status(201).json(userWithoutPassword);
  } catch (error) {
    logger.error('Error creating user:', error);
    return res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * Get all users by company
 * GET /api/users/company/:companyId
 */
router.get('/company/:companyId', authenticate, requireCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    
    const users = await getUsersByCompany(companyId);
    
    // Remove passwords from response
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    return res.status(200).json(usersWithoutPasswords);
  } catch (error) {
    logger.error('Error getting users by company:', error);
    return res.status(500).json({ error: 'Failed to get users' });
  }
});

/**
 * Get user by ID
 * GET /api/users/:id
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if requesting user has access to the user
    const user = await getUserById(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user is accessing their own profile or has admin access to the company
    if (req.user?.id !== id && 
        (req.user?.company_id !== user.company_id || req.user?.role !== 'orgadmin')) {
      return res.status(403).json({ error: 'You do not have permission to access this user' });
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    logger.error('Error getting user by ID:', error);
    return res.status(500).json({ error: 'Failed to get user' });
  }
});

/**
 * Update user
 * PUT /api/users/:id
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate request body
    const validation = userUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: validation.error.format() 
      });
    }
    
    // Check if user exists
    const existingUser = await getUserById(id);
    
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user is updating their own profile or has admin access to the company
    if (req.user?.id !== id && 
        (req.user?.company_id !== existingUser.company_id || req.user?.role !== 'orgadmin')) {
      return res.status(403).json({ error: 'You do not have permission to update this user' });
    }
    
    // Prevent role change unless admin
    if (req.body.role && req.user?.role !== 'orgadmin') {
      return res.status(403).json({ error: 'Only admins can change user roles' });
    }
    
    // Update user
    const updatedUser = await updateUser(id, req.body);
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;
    
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    logger.error('Error updating user:', error);
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * Delete user
 * DELETE /api/users/:id
 */
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const existingUser = await getUserById(id);
    
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user has access to the company
    if (req.user?.company_id !== existingUser.company_id && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to delete this user' });
    }
    
    // Delete user
    const success = await deleteUser(id);
    
    if (!success) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Error deleting user:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;