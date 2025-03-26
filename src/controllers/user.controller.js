/**
 * User controller containing all user-related business logic
 */
const User = require('../models/user.model');
const Company = require('../models/company.model');
const Department = require('../models/department.model');
const { generateId } = require('../utils/idGenerator');
const { generateToken, invalidateToken } = require('../utils/jwt');
const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');
const { success, error } = require('../utils/response');

/**
 * Create a new user
 * @route POST /api/users
 */
const createUser = asyncHandler(async (req, res) => {
  const { email, name, company_name, department, company_role, password, role = 'user' } = req.body;
  
  if (!email || !name || !company_name || !department || !company_role || !password) {
    return error(res, 'All fields are required', 400);
  }
  
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return error(res, 'User with this email already exists', 409);
  }
  
  try {
    // Find or create company
    let company = await Company.findOne({ name: company_name });
    if (!company) {
      const company_id = await generateId('COMP');
      company = await Company.create({
        company_id,
        name: company_name,
        assistant_id: 'pending',
        status: 'active'
      });
      
      // Create default Management department if this is a new company
      await Department.create({
        company_id: company.company_id,
        department_name: 'Management',
        department_desc: 'Company management department',
        user_head: 'admin'
      });
    }
    
    // Create user with custom ID
    const id = await generateId('USER');
    
    // Create the user
    const newUser = await User.create({
      id,
      email,
      name,
      company_id: company.company_id,
      role,
      department,
      company_role,
      password
    });
    
    // Generate JWT tokens
    const accessToken = await generateToken(newUser);
    
    return success(res, {
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        company_id: newUser.company_id,
        company_name: company.name,
        role: newUser.role,
        department: newUser.department,
        company_role: newUser.company_role
      },
      accessToken
    }, 201);
  } catch (err) {
    logger.error('Error creating user:', err);
    return error(res, 'Failed to create user', 500);
  }
});

/**
 * Get all users
 * @route GET /api/users
 */
const getUsers = asyncHandler(async (req, res) => {
  try {
    // Extract query parameters
    const { company_id, role, limit = 50, page = 1 } = req.query;
    
    // Build filter object
    const filter = {};
    if (company_id) filter.company_id = company_id;
    if (role) filter.role = role;
    
    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get users with pagination
    const users = await User.find(filter)
      .select('-password') // Exclude password
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });
    
    // Get total count for pagination
    const total = await User.countDocuments(filter);
    
    return success(res, {
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    logger.error('Error getting users:', err);
    return error(res, 'Failed to get users', 500);
  }
});

/**
 * Get user by ID
 * @route GET /api/users/:id
 */
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    const user = await User.findOne({ id }).select('-password');
    
    if (!user) {
      return error(res, 'User not found', 404);
    }
    
    return success(res, { user });
  } catch (err) {
    logger.error(`Error getting user with ID ${id}:`, err);
    return error(res, 'Failed to get user', 500);
  }
});

/**
 * Update user
 * @route PUT /api/users/:id
 */
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, department, company_role, role } = req.body;
  
  try {
    // Find user
    const user = await User.findOne({ id });
    
    if (!user) {
      return error(res, 'User not found', 404);
    }
    
    // Check if user has appropriate access
    // Only admin can change roles, or users can edit their own profiles
    const isAdmin = req.user.role === 'admin';
    const isOrgAdmin = req.user.role === 'orgadmin' && req.user.company_id === user.company_id;
    const isSelfEdit = req.user.id === id;
    
    if (!isAdmin && !isOrgAdmin && !isSelfEdit) {
      return error(res, 'You do not have permission to update this user', 403);
    }
    
    // Update fields
    if (name) user.name = name;
    if (department) user.department = department;
    if (company_role) user.company_role = company_role;
    
    // Only admin can update role
    if (role && isAdmin) {
      user.role = role;
    }
    
    await user.save();
    
    return success(res, {
      message: 'User updated successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company_id: user.company_id,
        role: user.role,
        department: user.department,
        company_role: user.company_role
      }
    });
  } catch (err) {
    logger.error(`Error updating user with ID ${id}:`, err);
    return error(res, 'Failed to update user', 500);
  }
});

/**
 * Delete user
 * @route DELETE /api/users/:id
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    // Find user
    const user = await User.findOne({ id });
    
    if (!user) {
      return error(res, 'User not found', 404);
    }
    
    // Check if user has appropriate access
    // Only admin or org admin from same company can delete users
    const isAdmin = req.user.role === 'admin';
    const isOrgAdmin = req.user.role === 'orgadmin' && req.user.company_id === user.company_id;
    
    if (!isAdmin && !isOrgAdmin) {
      return error(res, 'You do not have permission to delete this user', 403);
    }
    
    await User.deleteOne({ id });
    
    return success(res, {
      message: 'User deleted successfully'
    });
  } catch (err) {
    logger.error(`Error deleting user with ID ${id}:`, err);
    return error(res, 'Failed to delete user', 500);
  }
});

/**
 * User login
 * @route POST /api/users/login
 */
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return error(res, 'Email and password are required', 400);
  }
  
  try {
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      return error(res, 'Invalid credentials', 401);
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return error(res, 'Invalid credentials', 401);
    }
    
    // Generate tokens
    const accessToken = await generateToken(user);
    
    // Get company name
    const company = await Company.findOne({ company_id: user.company_id });
    
    return success(res, {
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company_id: user.company_id,
        company_name: company ? company.name : 'Unknown',
        role: user.role,
        department: user.department,
        company_role: user.company_role
      },
      accessToken
    });
  } catch (err) {
    logger.error('Error during login:', err);
    return error(res, 'Login failed', 500);
  }
});

/**
 * User logout
 * @route POST /api/users/logout
 */
const logoutUser = asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (token) {
    // Invalidate token in database
    await invalidateToken(token);
  }
  
  return success(res, {
    message: 'Logout successful'
  });
});

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  loginUser,
  logoutUser
};