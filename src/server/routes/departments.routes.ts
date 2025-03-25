import express from 'express';
import { 
  createDepartment, 
  getDepartmentsByCompany, 
  getDepartment, 
  updateDepartment, 
  deleteDepartment 
} from '../models/department.model';
import { authenticate, requireAdmin, requireCompanyAccess } from '../middleware/auth.middleware';
import logger from '../config/logger';
import { z } from 'zod';

const router = express.Router();

// Department validation schema
const departmentSchema = z.object({
  company_id: z.string().min(1, { message: "Company ID is required" }),
  department_name: z.string().min(2, { message: "Department name must be at least 2 characters" }),
  department_desc: z.string().min(1, { message: "Department description is required" }),
  user_head: z.string().min(1, { message: "Department head user ID is required" })
});

// Department update validation schema
const departmentUpdateSchema = z.object({
  department_desc: z.string().min(1, { message: "Department description is required" }).optional(),
  user_head: z.string().min(1, { message: "Department head user ID is required" }).optional()
});

/**
 * Create a new department
 * POST /api/departments
 */
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    // Validate request body
    const validation = departmentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: validation.error.format() 
      });
    }

    // Check if user has access to the company
    if (req.user?.company_id !== req.body.company_id && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to add departments to this company' });
    }
    
    // Create new department
    const newDepartment = await createDepartment(req.body);
    
    return res.status(201).json(newDepartment);
  } catch (error) {
    logger.error('Error creating department:', error);
    return res.status(500).json({ error: 'Failed to create department' });
  }
});

/**
 * Get departments by company
 * GET /api/departments/company/:companyId
 */
router.get('/company/:companyId', authenticate, requireCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    
    const departments = await getDepartmentsByCompany(companyId);
    
    return res.status(200).json(departments);
  } catch (error) {
    logger.error('Error getting departments by company:', error);
    return res.status(500).json({ error: 'Failed to get departments' });
  }
});

/**
 * Get department by company ID and department name
 * GET /api/departments/:companyId/:departmentName
 */
router.get('/:companyId/:departmentName', authenticate, requireCompanyAccess, async (req, res) => {
  try {
    const { companyId, departmentName } = req.params;
    
    const department = await getDepartment(companyId, departmentName);
    
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    return res.status(200).json(department);
  } catch (error) {
    logger.error('Error getting department:', error);
    return res.status(500).json({ error: 'Failed to get department' });
  }
});

/**
 * Update department
 * PUT /api/departments/:companyId/:departmentName
 */
router.put('/:companyId/:departmentName', authenticate, requireAdmin, async (req, res) => {
  try {
    const { companyId, departmentName } = req.params;
    
    // Validate request body
    const validation = departmentUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: validation.error.format() 
      });
    }
    
    // Check if department exists
    const existingDepartment = await getDepartment(companyId, departmentName);
    
    if (!existingDepartment) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    // Check if user has access to the company
    if (req.user?.company_id !== companyId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to update departments in this company' });
    }
    
    // Update department
    const updatedDepartment = await updateDepartment(companyId, departmentName, req.body);
    
    if (!updatedDepartment) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    return res.status(200).json(updatedDepartment);
  } catch (error) {
    logger.error('Error updating department:', error);
    return res.status(500).json({ error: 'Failed to update department' });
  }
});

/**
 * Delete department
 * DELETE /api/departments/:companyId/:departmentName
 */
router.delete('/:companyId/:departmentName', authenticate, requireAdmin, async (req, res) => {
  try {
    const { companyId, departmentName } = req.params;
    
    // Check if department exists
    const existingDepartment = await getDepartment(companyId, departmentName);
    
    if (!existingDepartment) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    // Check if user has access to the company
    if (req.user?.company_id !== companyId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to delete departments in this company' });
    }
    
    // Delete department
    const success = await deleteDepartment(companyId, departmentName);
    
    if (!success) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    return res.status(200).json({ message: 'Department deleted successfully' });
  } catch (error) {
    logger.error('Error deleting department:', error);
    return res.status(500).json({ error: 'Failed to delete department' });
  }
});

export default router;