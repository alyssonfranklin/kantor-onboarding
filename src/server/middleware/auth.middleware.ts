import { Request, Response, NextFunction } from 'express';
import { verifyToken, isTokenValid } from '../utils/jwt-utils';
import logger from '../config/logger';

// Extend Express Request type to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        company_id: string;
      };
    }
  }
}

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Check if token exists in database and is valid
    const isValid = await isTokenValid(token);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    // Verify token and extract payload
    const decoded = verifyToken(token);
    
    // Add user info to request object
    req.user = {
      id: decoded.id as string,
      email: decoded.email as string,
      role: decoded.role as string,
      company_id: decoded.company_id as string
    };
    
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Middleware to check if user has admin role
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role !== 'orgadmin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};

/**
 * Middleware to check if user belongs to specific company
 */
export const requireCompanyAccess = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const companyId = req.params.companyId || req.body.company_id;
  
  if (!companyId) {
    return res.status(400).json({ error: 'Company ID required' });
  }
  
  if (req.user.company_id !== companyId && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied to this company' });
  }
  
  next();
};