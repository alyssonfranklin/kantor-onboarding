/**
 * Department routes
 */
const express = require('express');
const {
  createDepartment,
  getDepartments,
  getDepartmentById,
  getDepartmentsByCompanyId,
  updateDepartment,
  deleteDepartment
} = require('../controllers/department.controller');
const { isAdmin, isOrgAdmin } = require('../middleware/auth');
const router = express.Router();

// All routes here already have auth middleware applied through the main router

// Department routes
router.post('/', isOrgAdmin, createDepartment);  // Create department (org admin or admin)
router.get('/', getDepartments);                // Get all departments (filtered by permissions)
router.get('/:id', getDepartmentById);           // Get department by ID
router.get('/company/:companyId', getDepartmentsByCompanyId); // Get departments by company ID
router.put('/:id', isOrgAdmin, updateDepartment); // Update department (org admin or admin)
router.delete('/:id', isOrgAdmin, deleteDepartment); // Delete department (org admin or admin)

module.exports = router;