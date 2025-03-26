/**
 * Company controller containing all company-related business logic
 */
const Company = require('../models/company.model');
const Department = require('../models/department.model');
const User = require('../models/user.model');
const { generateId } = require('../utils/idGenerator');
const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');
const { success, error } = require('../utils/response');

/**
 * Create a new company
 * @route POST /api/companies
 */
const createCompany = asyncHandler(async (req, res) => {
  const { name, assistant_id, status = 'active' } = req.body;
  
  if (!name || !assistant_id) {
    return error(res, 'Company name and assistant_id are required', 400);
  }
  
  try {
    // Check if company already exists
    const existingCompany = await Company.findOne({ name });
    if (existingCompany) {
      return error(res, 'Company with this name already exists', 409);
    }
    
    // Generate company ID
    const company_id = await generateId('COMP');
    
    // Create the company
    const company = await Company.create({
      company_id,
      name,
      assistant_id,
      status
    });
    
    // Create default Management department
    await Department.create({
      company_id: company.company_id,
      department_name: 'Management',
      department_desc: 'Company management department',
      user_head: 'admin'
    });
    
    return success(res, {
      message: 'Company created successfully',
      company
    }, 201);
  } catch (err) {
    logger.error('Error creating company:', err);
    return error(res, 'Failed to create company', 500);
  }
});

/**
 * Get all companies
 * @route GET /api/companies
 */
const getCompanies = asyncHandler(async (req, res) => {
  try {
    // Extract query parameters
    const { status, limit = 50, page = 1 } = req.query;
    
    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    
    // Get user role and company
    const isAdmin = req.user.role === 'admin';
    
    // If not admin, restrict to user's company
    if (!isAdmin) {
      filter.company_id = req.user.company_id;
    }
    
    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get companies with pagination
    const companies = await Company.find(filter)
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });
    
    // Get total count for pagination
    const total = await Company.countDocuments(filter);
    
    return success(res, {
      companies,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    logger.error('Error getting companies:', err);
    return error(res, 'Failed to get companies', 500);
  }
});

/**
 * Get company by ID
 * @route GET /api/companies/:id
 */
const getCompanyById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    const company = await Company.findOne({ company_id: id });
    
    if (!company) {
      return error(res, 'Company not found', 404);
    }
    
    // Check if user has access to this company
    const isAdmin = req.user.role === 'admin';
    const isSameCompany = req.user.company_id === company.company_id;
    
    if (!isAdmin && !isSameCompany) {
      return error(res, 'You do not have permission to view this company', 403);
    }
    
    // Get department count
    const departmentCount = await Department.countDocuments({ company_id: company.company_id });
    
    // Get user count
    const userCount = await User.countDocuments({ company_id: company.company_id });
    
    return success(res, { 
      company,
      stats: {
        departmentCount,
        userCount
      }
    });
  } catch (err) {
    logger.error(`Error getting company with ID ${id}:`, err);
    return error(res, 'Failed to get company', 500);
  }
});

/**
 * Update company
 * @route PUT /api/companies/:id
 */
const updateCompany = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, assistant_id, status } = req.body;
  
  try {
    // Find company
    const company = await Company.findOne({ company_id: id });
    
    if (!company) {
      return error(res, 'Company not found', 404);
    }
    
    // Check if user has permission to update
    const isAdmin = req.user.role === 'admin';
    const isOrgAdmin = req.user.role === 'orgadmin' && req.user.company_id === company.company_id;
    
    if (!isAdmin && !isOrgAdmin) {
      return error(res, 'You do not have permission to update this company', 403);
    }
    
    // Update fields
    if (name) company.name = name;
    if (assistant_id) company.assistant_id = assistant_id;
    if (status) company.status = status;
    
    company.updated_at = new Date();
    
    await company.save();
    
    return success(res, {
      message: 'Company updated successfully',
      company
    });
  } catch (err) {
    logger.error(`Error updating company with ID ${id}:`, err);
    return error(res, 'Failed to update company', 500);
  }
});

/**
 * Delete company
 * @route DELETE /api/companies/:id
 */
const deleteCompany = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    // Find company
    const company = await Company.findOne({ company_id: id });
    
    if (!company) {
      return error(res, 'Company not found', 404);
    }
    
    // Check if user has permission to delete
    // Only super admin can delete companies
    const isAdmin = req.user.role === 'admin';
    
    if (!isAdmin) {
      return error(res, 'You do not have permission to delete this company', 403);
    }
    
    // Check if company has users
    const userCount = await User.countDocuments({ company_id: company.company_id });
    
    if (userCount > 0) {
      return error(res, 'Cannot delete company with active users', 400);
    }
    
    // Delete all departments
    await Department.deleteMany({ company_id: company.company_id });
    
    // Delete company
    await Company.deleteOne({ company_id: id });
    
    return success(res, {
      message: 'Company deleted successfully'
    });
  } catch (err) {
    logger.error(`Error deleting company with ID ${id}:`, err);
    return error(res, 'Failed to delete company', 500);
  }
});

module.exports = {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany
};