/**
 * Logger utility using Winston
 * Handles application logging with different levels
 */
const winston = require('winston');
const config = require('../config/config');

// Define custom format with timestamp and colorization
const { combine, timestamp, printf, colorize } = winston.format;

const logFormat = printf(({ level, message, timestamp, ...meta }) => {
  return `${timestamp} [${level}]: ${message} ${
    Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
  }`;
});

// Create logger instance
const logger = winston.createLogger({
  level: config.env === 'development' ? 'debug' : config.logs,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      )
    }),
    // Add file transport for production
    ...(config.env === 'production' ? [
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' })
    ] : [])
  ]
});

// Capture unhandled exceptions and promise rejections
logger.exceptions.handle(
  new winston.transports.Console({ 
    format: combine(
      colorize({ all: true }),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      logFormat
    )
  })
);

// Handle uncaught promise rejections
process.on('unhandledRejection', (ex) => {
  throw ex;
});

module.exports = logger;