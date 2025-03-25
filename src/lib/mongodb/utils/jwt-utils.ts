import jwt from 'jsonwebtoken';
import { IUser } from '../models/user.model';
import Token from '../models/token.model';

const JWT_SECRET = process.env.JWT_SECRET || 'voxerion_secret_key_change_in_production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

/**
 * Generate a JWT token for a user
 */
export const generateToken = async (user: IUser): Promise<string> => {
  try {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      company_id: user.company_id
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    
    // Calculate expiry date
    const expiryDays = parseInt(JWT_EXPIRY.replace('d', ''), 10);
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + expiryDays);
    
    // Store token in database
    await Token.create({
      token,
      user_id: user.id,
      expires_at: expiry
    });
    
    return token;
  } catch (error) {
    console.error('Error generating JWT token:', error);
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
    console.error('Error verifying JWT token:', error);
    throw new Error('Invalid or expired token');
  }
};

/**
 * Check if a token exists in the database
 */
export const isTokenValid = async (token: string): Promise<boolean> => {
  try {
    const storedToken = await Token.findOne({ token });
    return !!storedToken;
  } catch (error) {
    console.error('Error validating token in database:', error);
    return false;
  }
};

/**
 * Invalidate a token by removing it from the database
 */
export const invalidateToken = async (token: string): Promise<boolean> => {
  try {
    const result = await Token.deleteOne({ token });
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error invalidating token:', error);
    return false;
  }
};