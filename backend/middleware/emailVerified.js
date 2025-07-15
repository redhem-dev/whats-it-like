/**
 * Middleware to check if user's email is verified
 * Only allows access to routes if the user has verified their email
 */
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    // User ID is attached to req.user by the auth middleware
    const userId = req.user.userId;
    
    // Get user from database
    const user = await User.findById(userId);
    
    // Check if user exists
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(403).json({ 
        success: false,
        message: 'Email not verified. Please verify your email to access this resource.',
        requiresEmailVerification: true
      });
    }
    
    // Email is verified, proceed to next middleware
    next();
  } catch (error) {
    console.error('Email verification middleware error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};
