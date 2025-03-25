import jwt from 'jsonwebtoken';
import { db } from '../db/db';
import { User, AccessToken } from '../types/db.types';
import logger from '../config/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key_change_in_production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

/**
 * Generate a JWT token for a user
 */
export const generateToken = async (user: User): Promise<string> => {
  try {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      company_id: user.company_id
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    
    // Calculate expiry date
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + parseInt(JWT_EXPIRY.replace('d', ''), 10));
    
    // Store token in database
    await db.read();
    if (db.data) {
      db.data.accessTokens.push({
        token,
        user_id: user.id,
        expires_at: expiry.toISOString()
      });
      await db.write();
    }
    
    return token;
  } catch (error) {
    logger.error('Error generating JWT token:', error);
    throw new Error('Failed to generate authentication token');
  }
};

/**
 * Verify a JWT token
 */
export const verifyToken = (token: string): jwt.JwtPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    return decoded;
  } catch (error) {
    logger.error('Error verifying JWT token:', error);
    throw new Error('Invalid or expired token');
  }
};

/**
 * Check if a token exists in the database and is not expired
 */
export const isTokenValid = async (token: string): Promise<boolean> => {
  try {
    await db.read();
    
    if (!db.data) {
      return false;
    }
    
    const storedToken = db.data.accessTokens.find(t => t.token === token);
    
    if (!storedToken) {
      return false;
    }
    
    const expiryDate = new Date(storedToken.expires_at);
    const now = new Date();
    
    return expiryDate > now;
  } catch (error) {
    logger.error('Error validating token in database:', error);
    return false;
  }
};

/**
 * Invalidate a token by removing it from the database
 */
export const invalidateToken = async (token: string): Promise<boolean> => {
  try {
    await db.read();
    
    if (!db.data) {
      return false;
    }
    
    const initialLength = db.data.accessTokens.length;
    db.data.accessTokens = db.data.accessTokens.filter(t => t.token !== token);
    
    // If token was found and removed
    if (initialLength !== db.data.accessTokens.length) {
      await db.write();
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error('Error invalidating token:', error);
    return false;
  }
};

/**
 * Clean up expired tokens from the database
 */
export const cleanupExpiredTokens = async (): Promise<number> => {
  try {
    await db.read();
    
    if (!db.data) {
      return 0;
    }
    
    const now = new Date();
    const initialLength = db.data.accessTokens.length;
    
    db.data.accessTokens = db.data.accessTokens.filter(token => {
      const expiryDate = new Date(token.expires_at);
      return expiryDate > now;
    });
    
    const removedCount = initialLength - db.data.accessTokens.length;
    
    if (removedCount > 0) {
      await db.write();
      logger.info(`Cleaned up ${removedCount} expired tokens`);
    }
    
    return removedCount;
  } catch (error) {
    logger.error('Error cleaning up expired tokens:', error);
    return 0;
  }
};