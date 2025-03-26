/**
 * Department controller containing all department-related business logic
 */
const Department = require('../models/department.model');
const Company = require('../models/company.model');
const User = require('../models/user.model');
const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');
const { success, error } = require('../utils/response');

/**
 * Create a new department
 * @route POST /api/departments
 */
const createDepartment = asyncHandler(async (req, res) => {
  const { company_id, department_name, department_desc, user_head } = req.body;
  
  if (!company_id || !department_name || !department_desc || !user_head) {
    return error(res, 'All fields are required', 400);
  }
  
  try {
    // Check if company exists
    const company = await Company.findOne({ company_id });
    if (!company) {
      return error(res, 'Company not found', 404);
    }
    
    // Check if user has permission to create department
    const isAdmin = req.user.role === 'admin';
    const isOrgAdmin = req.user.role === 'orgadmin' && req.user.company_id === company_id;
    
    if (!isAdmin && !isOrgAdmin) {
      return error(res, 'You do not have permission to create a department for this company', 403);
    }
    
    // Check if department already exists
    const existingDepartment = await Department.findOne({ 
      company_id, 
      department_name 
    });
    
    if (existingDepartment) {
      return error(res, 'Department with this name already exists for this company', 409);
    }
    
    // Validate department head exists
    const headUser = await User.findOne({ id: user_head });
    if (!headUser) {
      return error(res, 'Department head user not found', 404);
    }
    
    // Create department
    const department = await Department.create({
      company_id,
      department_name,
      department_desc,
      user_head
    });
    
    return success(res, {
      message: 'Department created successfully',
      department
    }, 201);
  } catch (err) {
    logger.error('Error creating department:', err);
    return error(res, 'Failed to create department', 500);
  }
});

/**
 * Get all departments
 * @route GET /api/departments
 */
const getDepartments = asyncHandler(async (req, res) => {
  try {
    // Extract query parameters
    const { company_id, limit = 50, page = 1 } = req.query;
    
    // Build filter object
    const filter = {};
    
    // If company_id is provided, filter by it
    if (company_id) {
      filter.company_id = company_id;
    } else {
      // If company_id is not provided, check user permissions
      const isAdmin = req.user.role === 'admin';
      
      // If not admin, restrict to user's company
      if (!isAdmin) {
        filter.company_id = req.user.company_id;
      }
    }
    
    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get departments with pagination
    const departments = await Department.find(filter)
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });
    
    // Get total count for pagination
    const total = await Department.countDocuments(filter);
    
    // Populate user head names
    const departmentsWithHeads = await Promise.all(
      departments.map(async (dept) => {
        const head = await User.findOne({ id: dept.user_head }).select('name');
        return {
          ...dept.toObject(),
          user_head_name: head ? head.name : 'Unknown'
        };
      })
    );
    
    return success(res, {
      departments: departmentsWithHeads,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    logger.error('Error getting departments:', err);
    return error(res, 'Failed to get departments', 500);
  }
});

/**
 * Get department by ID
 * @route GET /api/departments/:id
 */
const getDepartmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    const department = await Department.findById(id);
    
    if (!department) {
      return error(res, 'Department not found', 404);
    }
    
    // Check if user has access to this department
    const isAdmin = req.user.role === 'admin';
    const isSameCompany = req.user.company_id === department.company_id;
    
    if (!isAdmin && !isSameCompany) {
      return error(res, 'You do not have permission to view this department', 403);
    }
    
    // Get department head
    const head = await User.findOne({ id: department.user_head }).select('name');
    
    // Get user count in department
    const userCount = await User.countDocuments({ 
      company_id: department.company_id,
      department: department.department_name
    });
    
    return success(res, { 
      department: {
        ...department.toObject(),
        user_head_name: head ? head.name : 'Unknown'
      },
      stats: {
        userCount
      }
    });
  } catch (err) {
    logger.error(`Error getting department with ID ${id}:`, err);
    return error(res, 'Failed to get department', 500);
  }
});

/**
 * Get departments by company ID
 * @route GET /api/departments/company/:companyId
 */
const getDepartmentsByCompanyId = asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  
  try {
    // Check if company exists
    const company = await Company.findOne({ company_id: companyId });
    if (!company) {
      return error(res, 'Company not found', 404);
    }
    
    // Check if user has access to this company
    const isAdmin = req.user.role === 'admin';
    const isSameCompany = req.user.company_id === companyId;
    
    if (!isAdmin && !isSameCompany) {
      return error(res, 'You do not have permission to view departments for this company', 403);
    }
    
    // Get departments
    const departments = await Department.find({ company_id: companyId })
      .sort({ department_name: 1 });
    
    // Populate user head names
    const departmentsWithHeads = await Promise.all(
      departments.map(async (dept) => {
        const head = await User.findOne({ id: dept.user_head }).select('name');
        return {
          ...dept.toObject(),
          user_head_name: head ? head.name : 'Unknown'
        };
      })
    );
    
    return success(res, { departments: departmentsWithHeads });
  } catch (err) {
    logger.error(`Error getting departments for company ${companyId}:`, err);
    return error(res, 'Failed to get departments', 500);
  }
});

/**
 * Update department
 * @route PUT /api/departments/:id
 */
const updateDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { department_name, department_desc, user_head } = req.body;
  
  try {
    // Find department
    const department = await Department.findById(id);
    
    if (!department) {
      return error(res, 'Department not found', 404);
    }
    
    // Check if user has permission to update
    const isAdmin = req.user.role === 'admin';
    const isOrgAdmin = req.user.role === 'orgadmin' && req.user.company_id === department.company_id;
    
    if (!isAdmin && !isOrgAdmin) {
      return error(res, 'You do not have permission to update this department', 403);
    }
    
    // Check if new department name already exists (if changing name)
    if (department_name && department_name !== department.department_name) {
      const existingDepartment = await Department.findOne({ 
        company_id: department.company_id, 
        department_name 
      });
      
      if (existingDepartment) {
        return error(res, 'Department with this name already exists for this company', 409);
      }
    }
    
    // Validate department head exists (if changing)
    if (user_head && user_head !== department.user_head) {
      const headUser = await User.findOne({ id: user_head });
      if (!headUser) {
        return error(res, 'Department head user not found', 404);
      }
    }
    
    // Update fields
    if (department_name) department.department_name = department_name;
    if (department_desc) department.department_desc = department_desc;
    if (user_head) department.user_head = user_head;
    
    await department.save();
    
    // Get updated head name for response
    const head = await User.findOne({ id: department.user_head }).select('name');
    
    return success(res, {
      message: 'Department updated successfully',
      department: {
        ...department.toObject(),
        user_head_name: head ? head.name : 'Unknown'
      }
    });
  } catch (err) {
    logger.error(`Error updating department with ID ${id}:`, err);
    return error(res, 'Failed to update department', 500);
  }
});

/**
 * Delete department
 * @route DELETE /api/departments/:id
 */
const deleteDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    // Find department
    const department = await Department.findById(id);
    
    if (!department) {
      return error(res, 'Department not found', 404);
    }
    
    // Check if user has permission to delete
    const isAdmin = req.user.role === 'admin';
    const isOrgAdmin = req.user.role === 'orgadmin' && req.user.company_id === department.company_id;
    
    if (!isAdmin && !isOrgAdmin) {
      return error(res, 'You do not have permission to delete this department', 403);
    }
    
    // Check if department is Management (can't delete default)
    if (department.department_name === 'Management') {
      return error(res, 'Cannot delete the Management department', 400);
    }
    
    // Check if department has users
    const userCount = await User.countDocuments({ 
      company_id: department.company_id,
      department: department.department_name
    });
    
    if (userCount > 0) {
      return error(res, 'Cannot delete department with active users', 400);
    }
    
    // Delete department
    await Department.findByIdAndDelete(id);
    
    return success(res, {
      message: 'Department deleted successfully'
    });
  } catch (err) {
    logger.error(`Error deleting department with ID ${id}:`, err);
    return error(res, 'Failed to delete department', 500);
  }
});

module.exports = {
  createDepartment,
  getDepartments,
  getDepartmentById,
  getDepartmentsByCompanyId,
  updateDepartment,
  deleteDepartment
};