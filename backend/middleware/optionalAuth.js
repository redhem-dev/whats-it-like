const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Default JWT secret if environment variable is not set
const JWT_SECRET = process.env.JWT_SECRET || 'whats-it-like-default-jwt-secret-key';

/**
 * Optional authentication middleware
 * Attempts to verify JWT token and attach user to request if present
 * But allows the request to proceed even without authentication
 */
module.exports = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    // If no token, just proceed (but req.user will be undefined)
    if (!token) {
      return next();
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find user by id
    const user = await User.findById(decoded.userId);
    
    if (user) {
      // Check if user is banned or suspended
      if (user.status !== 'active') {
        // Still proceed, but don't attach the user
        return next();
      }
      
      // Attach user to request object
      req.user = user;
      req.token = token;
    }
    
    next();
  } catch (error) {
    // On any error, still allow the request through
    // But don't attach user data
    next();
  }
};
