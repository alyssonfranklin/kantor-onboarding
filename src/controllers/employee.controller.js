/**
 * Employee controller containing all employee-related business logic
 */
const Employee = require('../models/employee.model');
const Company = require('../models/company.model');
const { generateId } = require('../utils/idGenerator');
const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');
const { success, error } = require('../utils/response');

/**
 * Create a new employee
 * @route POST /api/employees
 */
const createEmployee = asyncHandler(async (req, res) => {
  const { employee_name, employee_role, employee_leader, company_id } = req.body;
  
  if (!employee_name || !employee_role || !employee_leader || !company_id) {
    return error(res, 'All fields are required', 400);
  }
  
  try {
    // Check if company exists
    const company = await Company.findOne({ company_id });
    if (!company) {
      return error(res, 'Company not found', 404);
    }
    
    // Check if user has permission to create employee
    const isAdmin = req.user.role === 'admin';
    const isOrgAdmin = req.user.role === 'orgadmin' && req.user.company_id === company_id;
    
    if (!isAdmin && !isOrgAdmin) {
      return error(res, 'You do not have permission to create an employee for this company', 403);
    }
    
    // Generate employee ID
    const employee_id = await generateId('EMP');
    
    // Create employee
    const employee = await Employee.create({
      employee_id,
      employee_name,
      employee_role,
      employee_leader,
      company_id
    });
    
    return success(res, {
      message: 'Employee created successfully',
      employee
    }, 201);
  } catch (err) {
    logger.error('Error creating employee:', err);
    return error(res, 'Failed to create employee', 500);
  }
});

/**
 * Get all employees
 * @route GET /api/employees
 */
const getEmployees = asyncHandler(async (req, res) => {
  try {
    // Extract query parameters
    const { company_id, employee_leader, limit = 50, page = 1 } = req.query;
    
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
    
    // If employee_leader is provided, filter by it
    if (employee_leader) {
      filter.employee_leader = employee_leader;
    }
    
    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get employees with pagination
    const employees = await Employee.find(filter)
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });
    
    // Get total count for pagination
    const total = await Employee.countDocuments(filter);
    
    return success(res, {
      employees,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    logger.error('Error getting employees:', err);
    return error(res, 'Failed to get employees', 500);
  }
});

/**
 * Get employee by ID
 * @route GET /api/employees/:id
 */
const getEmployeeById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    const employee = await Employee.findOne({ employee_id: id });
    
    if (!employee) {
      return error(res, 'Employee not found', 404);
    }
    
    // Check if user has access to this employee
    const isAdmin = req.user.role === 'admin';
    const isSameCompany = req.user.company_id === employee.company_id;
    
    if (!isAdmin && !isSameCompany) {
      return error(res, 'You do not have permission to view this employee', 403);
    }
    
    // Get leader details
    const leader = await Employee.findOne({ employee_id: employee.employee_leader }).select('employee_name');
    
    return success(res, { 
      employee: {
        ...employee.toObject(),
        leader_name: leader ? leader.employee_name : 'Unknown'
      }
    });
  } catch (err) {
    logger.error(`Error getting employee with ID ${id}:`, err);
    return error(res, 'Failed to get employee', 500);
  }
});

/**
 * Get employees by company ID
 * @route GET /api/employees/company/:companyId
 */
const getEmployeesByCompanyId = asyncHandler(async (req, res) => {
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
      return error(res, 'You do not have permission to view employees for this company', 403);
    }
    
    // Get employees
    const employees = await Employee.find({ company_id: companyId })
      .sort({ employee_name: 1 });
    
    // Populate leader names
    const employeesWithLeaders = await Promise.all(
      employees.map(async (emp) => {
        const leader = await Employee.findOne({ employee_id: emp.employee_leader }).select('employee_name');
        return {
          ...emp.toObject(),
          leader_name: leader ? leader.employee_name : 'Unknown'
        };
      })
    );
    
    return success(res, { employees: employeesWithLeaders });
  } catch (err) {
    logger.error(`Error getting employees for company ${companyId}:`, err);
    return error(res, 'Failed to get employees', 500);
  }
});

/**
 * Get employees by leader ID
 * @route GET /api/employees/leader/:leaderId
 */
const getEmployeesByLeaderId = asyncHandler(async (req, res) => {
  const { leaderId } = req.params;
  
  try {
    // Get leader details
    const leader = await Employee.findOne({ employee_id: leaderId });
    
    if (!leader) {
      return error(res, 'Leader not found', 404);
    }
    
    // Check if user has access to this company
    const isAdmin = req.user.role === 'admin';
    const isSameCompany = req.user.company_id === leader.company_id;
    
    if (!isAdmin && !isSameCompany) {
      return error(res, 'You do not have permission to view employees for this leader', 403);
    }
    
    // Get employees
    const employees = await Employee.find({ employee_leader: leaderId })
      .sort({ employee_name: 1 });
    
    return success(res, { 
      leader: {
        employee_id: leader.employee_id,
        employee_name: leader.employee_name,
        employee_role: leader.employee_role,
        company_id: leader.company_id
      },
      employees,
      total: employees.length
    });
  } catch (err) {
    logger.error(`Error getting employees for leader ${leaderId}:`, err);
    return error(res, 'Failed to get employees', 500);
  }
});

/**
 * Update employee
 * @route PUT /api/employees/:id
 */
const updateEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { employee_name, employee_role, employee_leader } = req.body;
  
  try {
    // Find employee
    const employee = await Employee.findOne({ employee_id: id });
    
    if (!employee) {
      return error(res, 'Employee not found', 404);
    }
    
    // Check if user has permission to update
    const isAdmin = req.user.role === 'admin';
    const isOrgAdmin = req.user.role === 'orgadmin' && req.user.company_id === employee.company_id;
    
    if (!isAdmin && !isOrgAdmin) {
      return error(res, 'You do not have permission to update this employee', 403);
    }
    
    // Update fields
    if (employee_name) employee.employee_name = employee_name;
    if (employee_role) employee.employee_role = employee_role;
    if (employee_leader) employee.employee_leader = employee_leader;
    
    await employee.save();
    
    // Get updated leader name for response
    const leader = await Employee.findOne({ employee_id: employee.employee_leader }).select('employee_name');
    
    return success(res, {
      message: 'Employee updated successfully',
      employee: {
        ...employee.toObject(),
        leader_name: leader ? leader.employee_name : 'Unknown'
      }
    });
  } catch (err) {
    logger.error(`Error updating employee with ID ${id}:`, err);
    return error(res, 'Failed to update employee', 500);
  }
});

/**
 * Delete employee
 * @route DELETE /api/employees/:id
 */
const deleteEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    // Find employee
    const employee = await Employee.findOne({ employee_id: id });
    
    if (!employee) {
      return error(res, 'Employee not found', 404);
    }
    
    // Check if user has permission to delete
    const isAdmin = req.user.role === 'admin';
    const isOrgAdmin = req.user.role === 'orgadmin' && req.user.company_id === employee.company_id;
    
    if (!isAdmin && !isOrgAdmin) {
      return error(res, 'You do not have permission to delete this employee', 403);
    }
    
    // Check if employee is a leader for other employees
    const leaderCount = await Employee.countDocuments({ employee_leader: id });
    
    if (leaderCount > 0) {
      return error(res, 'Cannot delete employee who is a leader for other employees', 400);
    }
    
    // Delete employee
    await Employee.deleteOne({ employee_id: id });
    
    return success(res, {
      message: 'Employee deleted successfully'
    });
  } catch (err) {
    logger.error(`Error deleting employee with ID ${id}:`, err);
    return error(res, 'Failed to delete employee', 500);
  }
});

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeById,
  getEmployeesByCompanyId,
  getEmployeesByLeaderId,
  updateEmployee,
  deleteEmployee
};