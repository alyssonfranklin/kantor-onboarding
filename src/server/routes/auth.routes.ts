import express from 'express';
import { verifyPassword } from '../models/user.model';
import { generateToken, invalidateToken, cleanupExpiredTokens } from '../utils/jwt-utils';
import { authenticate } from '../middleware/auth.middleware';
import logger from '../config/logger';
import { z } from 'zod';

const router = express.Router();

// Login validation schema
const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" })
});

/**
 * Login route
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    // Validate request body
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: validation.error.format() 
      });
    }

    const { email, password } = req.body;
    
    // Verify user credentials
    const user = await verifyPassword(email, password);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate JWT token
    const token = await generateToken(user);
    
    // Clean up expired tokens (background task)
    cleanupExpiredTokens().catch(err => 
      logger.error('Error cleaning up expired tokens:', err)
    );
    
    // Return user info and token
    const { password: _, ...userWithoutPassword } = user;
    
    return res.status(200).json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    logger.error('Login error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
});

/**
 * Logout route
 * POST /api/auth/logout
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(400).json({ error: 'Invalid token format' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Invalidate token
    const success = await invalidateToken(token);
    
    if (!success) {
      return res.status(400).json({ error: 'Token not found' });
    }
    
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    return res.status(500).json({ error: 'Logout failed' });
  }
});

/**
 * Verify token route
 * GET /api/auth/verify
 */
router.get('/verify', authenticate, (req, res) => {
  // If middleware passes, token is valid
  return res.status(200).json({ 
    valid: true,
    user: req.user
  });
});

export default router;