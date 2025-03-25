import { db } from '../db/db';
import { User } from '../types/db.types';
import bcrypt from 'bcryptjs';
import { generateCustomId } from '../utils/id-generator';
import logger from '../config/logger';

/**
 * Create a new user
 */
export const createUser = async (userData: Omit<User, 'id' | 'created_at'>): Promise<User> => {
  try {
    await db.read();
    
    if (!db.data) {
      throw new Error('Database not initialized');
    }
    
    // Check if email already exists
    const existingUser = db.data.users.find(user => user.email === userData.email);
    if (existingUser) {
      throw new Error('Email already in use');
    }
    
    // Generate user ID
    const id = generateCustomId();
    
    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    // Create new user with timestamp
    const newUser: User = {
      id,
      email: userData.email,
      name: userData.name,
      company_id: userData.company_id,
      role: userData.role,
      created_at: new Date().toISOString(),
      department: userData.department,
      company_role: userData.company_role,
      password: hashedPassword
    };
    
    // Add to database
    db.data.users.push(newUser);
    await db.write();
    
    // Return user without password
    const { password, ...userWithoutPassword } = newUser;
    return newUser;
  } catch (error) {
    logger.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (id: string): Promise<User | null> => {
  try {
    await db.read();
    
    if (!db.data) {
      throw new Error('Database not initialized');
    }
    
    const user = db.data.users.find(user => user.id === id);
    return user || null;
  } catch (error) {
    logger.error('Error getting user by ID:', error);
    throw error;
  }
};

/**
 * Get user by email
 */
export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    await db.read();
    
    if (!db.data) {
      throw new Error('Database not initialized');
    }
    
    const user = db.data.users.find(user => user.email === email);
    return user || null;
  } catch (error) {
    logger.error('Error getting user by email:', error);
    throw error;
  }
};

/**
 * Get users by company ID
 */
export const getUsersByCompany = async (companyId: string): Promise<User[]> => {
  try {
    await db.read();
    
    if (!db.data) {
      throw new Error('Database not initialized');
    }
    
    return db.data.users.filter(user => user.company_id === companyId);
  } catch (error) {
    logger.error('Error getting users by company:', error);
    throw error;
  }
};

/**
 * Update user
 */
export const updateUser = async (id: string, userData: Partial<User>): Promise<User | null> => {
  try {
    await db.read();
    
    if (!db.data) {
      throw new Error('Database not initialized');
    }
    
    // Find user index
    const userIndex = db.data.users.findIndex(user => user.id === id);
    
    if (userIndex === -1) {
      return null;
    }
    
    // If updating password, hash it
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }
    
    // Update user
    const updatedUser = {
      ...db.data.users[userIndex],
      ...userData
    };
    
    db.data.users[userIndex] = updatedUser;
    await db.write();
    
    return updatedUser;
  } catch (error) {
    logger.error('Error updating user:', error);
    throw error;
  }
};

/**
 * Delete user
 */
export const deleteUser = async (id: string): Promise<boolean> => {
  try {
    await db.read();
    
    if (!db.data) {
      throw new Error('Database not initialized');
    }
    
    const initialLength = db.data.users.length;
    db.data.users = db.data.users.filter(user => user.id !== id);
    
    if (initialLength === db.data.users.length) {
      return false; // User not found
    }
    
    await db.write();
    return true;
  } catch (error) {
    logger.error('Error deleting user:', error);
    throw error;
  }
};

/**
 * Verify user password
 */
export const verifyPassword = async (email: string, password: string): Promise<User | null> => {
  try {
    const user = await getUserByEmail(email);
    
    if (!user) {
      return null; // User not found
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return null; // Password doesn't match
    }
    
    return user;
  } catch (error) {
    logger.error('Error verifying password:', error);
    throw error;
  }
};