import express from 'express';
import { 
  createEmployee, 
  getEmployeeById, 
  getEmployeesByCompany,
  getEmployeesByLeader,
  updateEmployee, 
  deleteEmployee 
} from '../models/employee.model';
import { authenticate, requireAdmin, requireCompanyAccess } from '../middleware/auth.middleware';
import logger from '../config/logger';
import { z } from 'zod';

const router = express.Router();

// Employee validation schema
const employeeSchema = z.object({
  employee_name: z.string().min(2, { message: "Employee name must be at least 2 characters" }),
  employee_role: z.string().min(1, { message: "Employee role is required" }),
  employee_leader: z.string().min(1, { message: "Employee leader ID is required" }),
  company_id: z.string().min(1, { message: "Company ID is required" })
});

// Employee update validation schema
const employeeUpdateSchema = z.object({
  employee_name: z.string().min(2, { message: "Employee name must be at least 2 characters" }).optional(),
  employee_role: z.string().min(1, { message: "Employee role is required" }).optional(),
  employee_leader: z.string().min(1, { message: "Employee leader ID is required" }).optional()
});

/**
 * Create a new employee
 * POST /api/employees
 */
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    // Validate request body
    const validation = employeeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: validation.error.format() 
      });
    }

    // Check if user has access to the company
    if (req.user?.company_id !== req.body.company_id && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to add employees to this company' });
    }
    
    // Create new employee
    const newEmployee = await createEmployee(req.body);
    
    return res.status(201).json(newEmployee);
  } catch (error) {
    logger.error('Error creating employee:', error);
    return res.status(500).json({ error: 'Failed to create employee' });
  }
});

/**
 * Get employees by company
 * GET /api/employees/company/:companyId
 */
router.get('/company/:companyId', authenticate, requireCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    
    const employees = await getEmployeesByCompany(companyId);
    
    return res.status(200).json(employees);
  } catch (error) {
    logger.error('Error getting employees by company:', error);
    return res.status(500).json({ error: 'Failed to get employees' });
  }
});

/**
 * Get employees by leader
 * GET /api/employees/leader/:leaderId
 */
router.get('/leader/:leaderId', authenticate, async (req, res) => {
  try {
    const { leaderId } = req.params;
    
    const employees = await getEmployeesByLeader(leaderId);
    
    // Filter employees by company access
    const accessibleEmployees = employees.filter(emp => 
      emp.company_id === req.user?.company_id || req.user?.role === 'admin'
    );
    
    return res.status(200).json(accessibleEmployees);
  } catch (error) {
    logger.error('Error getting employees by leader:', error);
    return res.status(500).json({ error: 'Failed to get employees' });
  }
});

/**
 * Get employee by ID
 * GET /api/employees/:id
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const employee = await getEmployeeById(id);
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Check if user has access to the company
    if (req.user?.company_id !== employee.company_id && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to access this employee' });
    }
    
    return res.status(200).json(employee);
  } catch (error) {
    logger.error('Error getting employee by ID:', error);
    return res.status(500).json({ error: 'Failed to get employee' });
  }
});

/**
 * Update employee
 * PUT /api/employees/:id
 */
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate request body
    const validation = employeeUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: validation.error.format() 
      });
    }
    
    // Check if employee exists
    const existingEmployee = await getEmployeeById(id);
    
    if (!existingEmployee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Check if user has access to the company
    if (req.user?.company_id !== existingEmployee.company_id && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to update this employee' });
    }
    
    // Update employee
    const updatedEmployee = await updateEmployee(id, req.body);
    
    if (!updatedEmployee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    return res.status(200).json(updatedEmployee);
  } catch (error) {
    logger.error('Error updating employee:', error);
    return res.status(500).json({ error: 'Failed to update employee' });
  }
});

/**
 * Delete employee
 * DELETE /api/employees/:id
 */
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if employee exists
    const existingEmployee = await getEmployeeById(id);
    
    if (!existingEmployee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Check if user has access to the company
    if (req.user?.company_id !== existingEmployee.company_id && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to delete this employee' });
    }
    
    // Delete employee
    const success = await deleteEmployee(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    return res.status(200).json({ message: 'Employee deleted successfully' });
  } catch (error) {
    logger.error('Error deleting employee:', error);
    return res.status(500).json({ error: 'Failed to delete employee' });
  }
});

export default router;