import { db } from '../db/db';
import { Department } from '../types/db.types';
import logger from '../config/logger';

/**
 * Create a new department
 */
export const createDepartment = async (departmentData: Department): Promise<Department> => {
  try {
    await db.read();
    
    if (!db.data) {
      throw new Error('Database not initialized');
    }
    
    // Check if department with same name already exists in the company
    const existingDepartment = db.data.departments.find(
      dept => dept.company_id === departmentData.company_id && 
      dept.department_name === departmentData.department_name
    );
    
    if (existingDepartment) {
      throw new Error('Department already exists in this company');
    }
    
    // Add to database
    db.data.departments.push(departmentData);
    await db.write();
    
    return departmentData;
  } catch (error) {
    logger.error('Error creating department:', error);
    throw error;
  }
};

/**
 * Get departments by company ID
 */
export const getDepartmentsByCompany = async (companyId: string): Promise<Department[]> => {
  try {
    await db.read();
    
    if (!db.data) {
      throw new Error('Database not initialized');
    }
    
    return db.data.departments.filter(dept => dept.company_id === companyId);
  } catch (error) {
    logger.error('Error getting departments by company:', error);
    throw error;
  }
};

/**
 * Get department by company ID and department name
 */
export const getDepartment = async (companyId: string, departmentName: string): Promise<Department | null> => {
  try {
    await db.read();
    
    if (!db.data) {
      throw new Error('Database not initialized');
    }
    
    const department = db.data.departments.find(
      dept => dept.company_id === companyId && dept.department_name === departmentName
    );
    
    return department || null;
  } catch (error) {
    logger.error('Error getting department:', error);
    throw error;
  }
};

/**
 * Update department
 */
export const updateDepartment = async (
  companyId: string, 
  departmentName: string, 
  departmentData: Partial<Department>
): Promise<Department | null> => {
  try {
    await db.read();
    
    if (!db.data) {
      throw new Error('Database not initialized');
    }
    
    // Find department index
    const departmentIndex = db.data.departments.findIndex(
      dept => dept.company_id === companyId && dept.department_name === departmentName
    );
    
    if (departmentIndex === -1) {
      return null;
    }
    
    // Update department
    const updatedDepartment = {
      ...db.data.departments[departmentIndex],
      ...departmentData
    };
    
    db.data.departments[departmentIndex] = updatedDepartment;
    await db.write();
    
    return updatedDepartment;
  } catch (error) {
    logger.error('Error updating department:', error);
    throw error;
  }
};

/**
 * Delete department
 */
export const deleteDepartment = async (companyId: string, departmentName: string): Promise<boolean> => {
  try {
    await db.read();
    
    if (!db.data) {
      throw new Error('Database not initialized');
    }
    
    const initialLength = db.data.departments.length;
    db.data.departments = db.data.departments.filter(
      dept => !(dept.company_id === companyId && dept.department_name === departmentName)
    );
    
    if (initialLength === db.data.departments.length) {
      return false; // Department not found
    }
    
    await db.write();
    return true;
  } catch (error) {
    logger.error('Error deleting department:', error);
    throw error;
  }
};