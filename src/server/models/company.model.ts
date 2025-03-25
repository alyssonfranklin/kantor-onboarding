import { db } from '../db/db';
import { Company } from '../types/db.types';
import { generateCustomId } from '../utils/id-generator';
import logger from '../config/logger';

/**
 * Create a new company
 */
export const createCompany = async (companyData: Omit<Company, 'company_id' | 'created_at' | 'updated_at'>): Promise<Company> => {
  try {
    await db.read();
    
    if (!db.data) {
      throw new Error('Database not initialized');
    }
    
    // Check if company with same name already exists
    const existingCompany = db.data.companies.find(company => company.name === companyData.name);
    if (existingCompany) {
      throw new Error('Company name already in use');
    }
    
    // Generate company ID
    const company_id = generateCustomId();
    
    // Current timestamp
    const now = new Date().toISOString();
    
    // Create new company with timestamps
    const newCompany: Company = {
      company_id,
      name: companyData.name,
      assistant_id: companyData.assistant_id,
      status: companyData.status || 'active',
      created_at: now,
      updated_at: now
    };
    
    // Add to database
    db.data.companies.push(newCompany);
    await db.write();
    
    return newCompany;
  } catch (error) {
    logger.error('Error creating company:', error);
    throw error;
  }
};

/**
 * Get company by ID
 */
export const getCompanyById = async (companyId: string): Promise<Company | null> => {
  try {
    await db.read();
    
    if (!db.data) {
      throw new Error('Database not initialized');
    }
    
    const company = db.data.companies.find(company => company.company_id === companyId);
    return company || null;
  } catch (error) {
    logger.error('Error getting company by ID:', error);
    throw error;
  }
};

/**
 * Get company by name
 */
export const getCompanyByName = async (name: string): Promise<Company | null> => {
  try {
    await db.read();
    
    if (!db.data) {
      throw new Error('Database not initialized');
    }
    
    const company = db.data.companies.find(company => company.name === name);
    return company || null;
  } catch (error) {
    logger.error('Error getting company by name:', error);
    throw error;
  }
};

/**
 * Get all companies
 */
export const getAllCompanies = async (): Promise<Company[]> => {
  try {
    await db.read();
    
    if (!db.data) {
      throw new Error('Database not initialized');
    }
    
    return db.data.companies;
  } catch (error) {
    logger.error('Error getting all companies:', error);
    throw error;
  }
};

/**
 * Update company
 */
export const updateCompany = async (companyId: string, companyData: Partial<Company>): Promise<Company | null> => {
  try {
    await db.read();
    
    if (!db.data) {
      throw new Error('Database not initialized');
    }
    
    // Find company index
    const companyIndex = db.data.companies.findIndex(company => company.company_id === companyId);
    
    if (companyIndex === -1) {
      return null;
    }
    
    // Update company with new timestamp
    const updatedCompany = {
      ...db.data.companies[companyIndex],
      ...companyData,
      updated_at: new Date().toISOString()
    };
    
    db.data.companies[companyIndex] = updatedCompany;
    await db.write();
    
    return updatedCompany;
  } catch (error) {
    logger.error('Error updating company:', error);
    throw error;
  }
};

/**
 * Delete company
 */
export const deleteCompany = async (companyId: string): Promise<boolean> => {
  try {
    await db.read();
    
    if (!db.data) {
      throw new Error('Database not initialized');
    }
    
    const initialLength = db.data.companies.length;
    db.data.companies = db.data.companies.filter(company => company.company_id !== companyId);
    
    if (initialLength === db.data.companies.length) {
      return false; // Company not found
    }
    
    await db.write();
    return true;
  } catch (error) {
    logger.error('Error deleting company:', error);
    throw error;
  }
};