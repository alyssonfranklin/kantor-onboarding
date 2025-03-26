/**
 * JWT utilities for token generation and verification
 */
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const logger = require('./logger');

/**
 * Generate JWT token for a user
 * @param {Object} user - User object
 * @param {String} type - Token type ('access' or 'refresh')
 * @returns {Object} Object containing token and expiry
 */
const generateToken = async (user, type = 'access') => {
  try {
    // Determine token expiry based on type
    const expiresIn = type === 'refresh' 
      ? config.jwtRefreshExpirationInterval 
      : config.jwtExpirationInterval;
    
    // Create payload with user data
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      company_id: user.company_id,
      type
    };
    
    // Sign the token
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn });
    
    // Calculate expiry date for storage
    const expiryDuration = type === 'refresh' 
      ? ms(config.jwtRefreshExpirationInterval) 
      : ms(config.jwtExpirationInterval);
    
    const expiryDate = new Date(Date.now() + expiryDuration);
    
    // Store token in database - would use Token model here
    // This will be implemented when we create the Token model
    /*
    await Token.create({
      token,
      user_id: user.id,
      type,
      expires_at: expiryDate
    });
    */
    
    return {
      token,
      expires: expiryDate.toISOString()
    };
  } catch (error) {
    logger.error(`Error generating ${type} token:`, error);
    throw new Error(`Failed to generate ${type} token`);
  }
};

/**
 * Verify a JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    logger.error('JWT verification error:', error);
    throw new Error('Invalid or expired token');
  }
};

/**
 * Check if a token exists and is valid in the database
 * @param {String} token - Token to check
 * @returns {Boolean} Whether the token is valid
 */
const isTokenValid = async (token) => {
  try {
    // This would check the Token model - will be implemented later
    // For now, just verify the token format
    const decoded = verifyToken(token);
    return !!decoded;
    
    /* 
    const storedToken = await Token.findOne({ 
      token, 
      revoked: false,
      expires_at: { $gt: new Date() }
    });
    
    return !!storedToken;
    */
  } catch (error) {
    logger.error('Error validating token in database:', error);
    return false;
  }
};

/**
 * Invalidate a token by marking it as revoked
 * @param {String} token - Token to invalidate
 * @returns {Boolean} Success status
 */
const invalidateToken = async (token) => {
  try {
    // This would update the Token model - will be implemented later
    // For now, just return true
    return true;
    
    /*
    const result = await Token.findOneAndUpdate(
      { token },
      { 
        revoked: true,
        revoked_at: new Date()
      }
    );
    
    return !!result;
    */
  } catch (error) {
    logger.error('Error invalidating token:', error);
    return false;
  }
};

// Helper function to parse ms from string like '7d' or '15m'
function ms(val) {
  const match = /^(\d+)([smhdwMy])$/.exec(val);
  if (!match) return val;
  
  const num = parseInt(match[1], 10);
  const type = match[2];
  
  const multipliers = {
    s: 1000,                 // second
    m: 60 * 1000,            // minute
    h: 60 * 60 * 1000,       // hour
    d: 24 * 60 * 60 * 1000,  // day
    w: 7 * 24 * 60 * 60 * 1000, // week
    M: 30 * 24 * 60 * 60 * 1000, // month (approx)
    y: 365 * 24 * 60 * 60 * 1000 // year (approx)
  };
  
  return num * multipliers[type];
}

module.exports = {
  generateToken,
  verifyToken,
  isTokenValid,
  invalidateToken
};