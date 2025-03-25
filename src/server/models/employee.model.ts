import { db } from '../db/db';
import { Employee } from '../types/db.types';
import { generateCustomId } from '../utils/id-generator';
import logger from '../config/logger';

/**
 * Create a new employee
 */
export const createEmployee = async (employeeData: Omit<Employee, 'employee_id'>): Promise<Employee> => {
  try {
    await db.read();
    
    if (!db.data) {
      throw new Error('Database not initialized');
    }
    
    // Generate employee ID
    const employee_id = generateCustomId();
    
    // Create new employee
    const newEmployee: Employee = {
      employee_id,
      employee_name: employeeData.employee_name,
      employee_role: employeeData.employee_role,
      employee_leader: employeeData.employee_leader,
      company_id: employeeData.company_id
    };
    
    // Add to database
    db.data.employees.push(newEmployee);
    await db.write();
    
    return newEmployee;
  } catch (error) {
    logger.error('Error creating employee:', error);
    throw error;
  }
};

/**
 * Get employee by ID
 */
export const getEmployeeById = async (employeeId: string): Promise<Employee | null> => {
  try {
    await db.read();
    
    if (!db.data) {
      throw new Error('Database not initialized');
    }
    
    const employee = db.data.employees.find(emp => emp.employee_id === employeeId);
    return employee || null;
  } catch (error) {
    logger.error('Error getting employee by ID:', error);
    throw error;
  }
};

/**
 * Get employees by company ID
 */
export const getEmployeesByCompany = async (companyId: string): Promise<Employee[]> => {
  try {
    await db.read();
    
    if (!db.data) {
      throw new Error('Database not initialized');
    }
    
    return db.data.employees.filter(emp => emp.company_id === companyId);
  } catch (error) {
    logger.error('Error getting employees by company:', error);
    throw error;
  }
};

/**
 * Get employees by leader
 */
export const getEmployeesByLeader = async (leaderId: string): Promise<Employee[]> => {
  try {
    await db.read();
    
    if (!db.data) {
      throw new Error('Database not initialized');
    }
    
    return db.data.employees.filter(emp => emp.employee_leader === leaderId);
  } catch (error) {
    logger.error('Error getting employees by leader:', error);
    throw error;
  }
};

/**
 * Update employee
 */
export const updateEmployee = async (employeeId: string, employeeData: Partial<Employee>): Promise<Employee | null> => {
  try {
    await db.read();
    
    if (!db.data) {
      throw new Error('Database not initialized');
    }
    
    // Find employee index
    const employeeIndex = db.data.employees.findIndex(emp => emp.employee_id === employeeId);
    
    if (employeeIndex === -1) {
      return null;
    }
    
    // Update employee
    const updatedEmployee = {
      ...db.data.employees[employeeIndex],
      ...employeeData
    };
    
    db.data.employees[employeeIndex] = updatedEmployee;
    await db.write();
    
    return updatedEmployee;
  } catch (error) {
    logger.error('Error updating employee:', error);
    throw error;
  }
};

/**
 * Delete employee
 */
export const deleteEmployee = async (employeeId: string): Promise<boolean> => {
  try {
    await db.read();
    
    if (!db.data) {
      throw new Error('Database not initialized');
    }
    
    const initialLength = db.data.employees.length;
    db.data.employees = db.data.employees.filter(emp => emp.employee_id !== employeeId);
    
    if (initialLength === db.data.employees.length) {
      return false; // Employee not found
    }
    
    await db.write();
    return true;
  } catch (error) {
    logger.error('Error deleting employee:', error);
    throw error;
  }
};