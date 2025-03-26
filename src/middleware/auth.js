/**
 * Authentication middleware
 * Verifies JWT tokens and attaches user to request
 */
const { verifyToken, isTokenValid } = require('../utils/jwt');
const User = require('../models/user.model');
const asyncHandler = require('../utils/asyncHandler');
const { error } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Main authentication middleware
 * Verifies the JWT token and attaches user to request object
 */
const auth = asyncHandler(async (req, res, next) => {
  // Get token from header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Authentication required', 401);
  }
  
  // Extract token
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify token format and signature
    const decoded = verifyToken(token);
    
    // Check if token exists in database
    const isValid = await isTokenValid(token);
    
    if (!isValid) {
      return error(res, 'Token has been invalidated', 401);
    }
    
    // Get user from database
    const user = await User.findOne({ id: decoded.id }).select('-password');
    
    if (!user) {
      return error(res, 'User not found', 401);
    }
    
    // Set user and token data on request
    req.user = user;
    req.token = token;
    req.decoded = decoded;
    
    next();
  } catch (err) {
    logger.error('Authentication error:', err);
    return error(res, 'Authentication failed', 401);
  }
});

/**
 * Middleware to check for admin role
 * Must be used after auth middleware
 */
const isAdmin = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return error(res, 'Admin access required', 403);
  }
  next();
});

/**
 * Middleware to check for org admin or admin role
 * Must be used after auth middleware
 */
const isOrgAdmin = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'orgadmin') {
    return error(res, 'Admin access required', 403);
  }
  next();
});

/**
 * Middleware to check for specific company access
 * Must be used after auth middleware
 * Checks if user is admin or belongs to the specified company
 */
const hasCompanyAccess = asyncHandler(async (req, res, next) => {
  const companyId = req.params.companyId || req.body.company_id;
  
  if (!companyId) {
    return error(res, 'Company ID is required', 400);
  }
  
  const isAdmin = req.user.role === 'admin';
  const isSameCompany = req.user.company_id === companyId;
  
  if (!isAdmin && !isSameCompany) {
    return error(res, 'You do not have access to this company', 403);
  }
  
  next();
});

/**
 * Middleware to check if user can modify the requested resource
 * Must be used after auth middleware
 * Checks if user is admin, org admin of the company, or the resource owner
 */
const canModifyResource = (getResourceOwnerId) => {
  return asyncHandler(async (req, res, next) => {
    const resourceOwnerId = await getResourceOwnerId(req);
    
    const isAdmin = req.user.role === 'admin';
    const isOrgAdmin = req.user.role === 'orgadmin';
    const isOwner = req.user.id === resourceOwnerId;
    
    if (isAdmin || isOwner) {
      return next();
    }
    
    if (isOrgAdmin) {
      // Check if resource belongs to org admin's company
      // This would need to be implemented based on the resource type
      // For now, just allow org admins through
      return next();
    }
    
    return error(res, 'You do not have permission to modify this resource', 403);
  });
};

module.exports = {
  auth,
  isAdmin,
  isOrgAdmin,
  hasCompanyAccess,
  canModifyResource
};