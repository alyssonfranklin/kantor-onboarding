/**
 * Main router that combines all API routes
 */
const express = require('express');
const userRoutes = require('./user.routes');
const companyRoutes = require('./company.routes');
const departmentRoutes = require('./department.routes');
const employeeRoutes = require('./employee.routes');
const tokenRoutes = require('./token.routes');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API is running' });
});

// Mount routes
router.use('/users', userRoutes);
router.use('/companies', auth, companyRoutes);
router.use('/departments', auth, departmentRoutes);
router.use('/employees', auth, employeeRoutes);
router.use('/tokens', tokenRoutes);

// 404 handler
router.use('*', (req, res) => {
  res.status(404).json({ 
    status: 'error', 
    message: 'Route not found',
    path: req.originalUrl
  });
});

module.exports = router;