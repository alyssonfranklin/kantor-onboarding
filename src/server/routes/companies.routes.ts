import express from 'express';
import { 
  createCompany, 
  getCompanyById, 
  getCompanyByName, 
  getAllCompanies, 
  updateCompany, 
  deleteCompany 
} from '../models/company.model';
import { authenticate, requireAdmin, requireCompanyAccess } from '../middleware/auth.middleware';
import logger from '../config/logger';
import { z } from 'zod';

const router = express.Router();

// Company creation validation schema
const companyCreateSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  assistant_id: z.string().min(1, { message: "Assistant ID is required" }),
  status: z.string().default('active')
});

// Company update validation schema
const companyUpdateSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }).optional(),
  assistant_id: z.string().optional(),
  status: z.string().optional()
});

/**
 * Create a new company
 * POST /api/companies
 */
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    // Validate request body
    const validation = companyCreateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: validation.error.format() 
      });
    }

    // Check if company with same name already exists
    const existingCompany = await getCompanyByName(req.body.name);
    if (existingCompany) {
      return res.status(400).json({ error: 'Company name already in use' });
    }
    
    // Create new company
    const newCompany = await createCompany(req.body);
    
    return res.status(201).json(newCompany);
  } catch (error) {
    logger.error('Error creating company:', error);
    return res.status(500).json({ error: 'Failed to create company' });
  }
});

/**
 * Get all companies
 * GET /api/companies
 */
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const companies = await getAllCompanies();
    
    // If not admin, filter to only show user's company
    if (req.user?.role !== 'admin') {
      const userCompany = companies.filter(company => company.company_id === req.user?.company_id);
      return res.status(200).json(userCompany);
    }
    
    return res.status(200).json(companies);
  } catch (error) {
    logger.error('Error getting all companies:', error);
    return res.status(500).json({ error: 'Failed to get companies' });
  }
});

/**
 * Get company by ID
 * GET /api/companies/:id
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const company = await getCompanyById(id);
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    // Check if user has access to the company
    if (req.user?.company_id !== company.company_id && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to access this company' });
    }
    
    return res.status(200).json(company);
  } catch (error) {
    logger.error('Error getting company by ID:', error);
    return res.status(500).json({ error: 'Failed to get company' });
  }
});

/**
 * Update company
 * PUT /api/companies/:id
 */
router.put('/:id', authenticate, requireCompanyAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate request body
    const validation = companyUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: validation.error.format() 
      });
    }
    
    // Check if company exists
    const existingCompany = await getCompanyById(id);
    
    if (!existingCompany) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    // If changing name, check if new name is already in use
    if (req.body.name && req.body.name !== existingCompany.name) {
      const companyWithSameName = await getCompanyByName(req.body.name);
      if (companyWithSameName) {
        return res.status(400).json({ error: 'Company name already in use' });
      }
    }
    
    // Update company
    const updatedCompany = await updateCompany(id, req.body);
    
    if (!updatedCompany) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    return res.status(200).json(updatedCompany);
  } catch (error) {
    logger.error('Error updating company:', error);
    return res.status(500).json({ error: 'Failed to update company' });
  }
});

/**
 * Delete company
 * DELETE /api/companies/:id
 */
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if company exists
    const existingCompany = await getCompanyById(id);
    
    if (!existingCompany) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    // Only system admin or company admin can delete company
    if (req.user?.company_id !== id && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to delete this company' });
    }
    
    // Delete company
    const success = await deleteCompany(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    return res.status(200).json({ message: 'Company deleted successfully' });
  } catch (error) {
    logger.error('Error deleting company:', error);
    return res.status(500).json({ error: 'Failed to delete company' });
  }
});

export default router;