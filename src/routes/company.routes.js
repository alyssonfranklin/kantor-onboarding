/**
 * Company routes
 */
const express = require('express');
const {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany
} = require('../controllers/company.controller');
const { isAdmin, isOrgAdmin } = require('../middleware/auth');
const router = express.Router();

// All routes here already have auth middleware applied through the main router

// Company routes
router.post('/', isAdmin, createCompany);    // Create company (admin only)
router.get('/', getCompanies);              // Get all companies (filtered by permissions)
router.get('/:id', getCompanyById);         // Get company by ID
router.put('/:id', isOrgAdmin, updateCompany); // Update company (org admin or admin)
router.delete('/:id', isAdmin, deleteCompany); // Delete company (admin only)

module.exports = router;