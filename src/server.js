/**
 * Server entry point
 * Starts the Express application
 */
const app = require('./app');
const config = require('./config/config');
const logger = require('./utils/logger');

// Start server
const server = app.listen(config.port, () => {
  logger.info(`Server running in ${config.env} mode on port ${config.port}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  // Close server & exit process with failure
  server.close(() => process.exit(1));
});

// Handle SIGTERM signal
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated.');
  });
});

module.exports = server;