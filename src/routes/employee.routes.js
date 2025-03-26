/**
 * Employee routes
 */
const express = require('express');
const {
  createEmployee,
  getEmployees,
  getEmployeeById,
  getEmployeesByCompanyId,
  getEmployeesByLeaderId,
  updateEmployee,
  deleteEmployee
} = require('../controllers/employee.controller');
const { isAdmin, isOrgAdmin } = require('../middleware/auth');
const router = express.Router();

// All routes here already have auth middleware applied through the main router

// Employee routes
router.post('/', isOrgAdmin, createEmployee);  // Create employee (org admin or admin)
router.get('/', getEmployees);                // Get all employees (filtered by permissions)
router.get('/:id', getEmployeeById);           // Get employee by ID
router.get('/company/:companyId', getEmployeesByCompanyId); // Get employees by company ID
router.get('/leader/:leaderId', getEmployeesByLeaderId);   // Get employees by leader ID
router.put('/:id', isOrgAdmin, updateEmployee); // Update employee (org admin or admin)
router.delete('/:id', isOrgAdmin, deleteEmployee); // Delete employee (org admin or admin)

module.exports = router;