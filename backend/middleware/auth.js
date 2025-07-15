const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Default JWT secret if environment variable is not set
const JWT_SECRET = process.env.JWT_SECRET || 'whats-it-like-default-jwt-secret-key';

/**
 * Authentication middleware to protect routes
 * Verifies the JWT token and attaches the user to the request
 */
module.exports = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find user by id
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Check if user is banned or suspended
    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Account is ' + user.status });
    }
    
    // Attach user to request object
    req.user = {
      userId: user._id,
      email: user.email,
      status: user.status
    };
    req.token = token;
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid authentication token' });
  }
};
