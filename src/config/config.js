/**
 * General application configuration
 * Uses environment variables with sensible defaults
 */
const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
  jwtExpirationInterval: process.env.JWT_EXPIRY || '7d',
  jwtRefreshExpirationInterval: process.env.JWT_REFRESH_EXPIRY || '30d',
  allowedOrigins: process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : ['https://script.google.com', 'https://www.google.com', 'http://localhost:3000'],
  logs: process.env.LOG_LEVEL || 'info',
  // Optional rate limiting
  rateLimitRequests: parseInt(process.env.RATE_LIMIT_REQUESTS, 10) || 100,
  rateLimitTime: parseInt(process.env.RATE_LIMIT_TIME, 10) || 15 * 60 * 1000, // 15 minutes in milliseconds
};

module.exports = config;