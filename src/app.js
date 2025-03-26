/**
 * Main Express application file
 * Sets up middleware, routes, and error handling
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { connectWithMongoose } = require('./config/database');
const config = require('./config/config');
const logger = require('./utils/logger');
const routes = require('./routes');

// Create Express app
const app = express();

// Connect to MongoDB
connectWithMongoose()
  .then(() => {
    logger.info('Connected to MongoDB');
  })
  .catch((err) => {
    logger.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });

// Middleware
app.use(helmet());  // Set security headers
app.use(express.json({ limit: '10mb' }));  // Parse JSON request bodies
app.use(express.urlencoded({ extended: true }));  // Parse URL-encoded request bodies

// Set up CORS
app.use(cors({
  origin: config.allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Logging middleware
if (config.env === 'development') {
  app.use(morgan('dev'));  // Log requests to console in development
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.http(message.trim())
    }
  }));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitTime,
  max: config.rateLimitRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests, please try again later.',
    code: 429
  }
});
app.use(limiter);

// Routes
app.use('/api/v1', routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Kantor API Server',
    version: '1.0.0',
    documentation: '/api/v1/docs'
  });
});

// 404 handler - catch all requests for non-existent routes
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(err.stack || err);
  
  // Format error response
  const statusCode = err.statusCode || 500;
  const errorResponse = {
    status: 'error',
    message: err.message || 'Internal Server Error',
    code: statusCode
  };
  
  // Include stack trace in development
  if (config.env === 'development') {
    errorResponse.stack = err.stack;
  }
  
  res.status(statusCode).json(errorResponse);
});

module.exports = app;