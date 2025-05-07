const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');

// Default JWT secret if environment variable is not set
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * User signup controller
 * @route POST /api/auth/signup
 */
exports.signup = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create new user
    user = new User({
      email,
      firstName,
      lastName,
      passwordHash,
      // For MVP, we set email as verified since verification is not implemented yet
      // emailVerified: false,
    });

    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (excluding password) and token
    return res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * User login controller
 * @route POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if account is locked
    if (user.isLocked()) {
      return res.status(403).json({ message: 'Account is temporarily locked. Try again later.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      // Increment login attempts
      user.loginAttempts += 1;
      
      // Lock account if too many failed attempts (5 attempts)
      if (user.loginAttempts >= 5) {
        // Lock for 30 minutes
        user.lockUntil = Date.now() + 30 * 60 * 1000;
      }
      
      await user.save();
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lastLogin = Date.now();
    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        status: user.status,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get user profile
 * @route GET /api/auth/me
 * Requires authentication
 */
exports.getProfile = async (req, res) => {
  try {
    // User is already attached to req by auth middleware
    const user = await User.findById(req.user._id).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Google OAuth authentication - Redirect to Google
 * @route GET /api/auth/google
 */
exports.googleAuth = passport.authenticate('google', {
  scope: ['email', 'profile']
});

/**
 * Google OAuth callback
 * @route GET /api/auth/google/callback
 */
exports.googleAuthCallback = [
  passport.authenticate('google', { session: false, failureRedirect: '/signin' }),
  (req, res) => {
    try {
      // Generate JWT token for the authenticated Google user
      const token = jwt.sign(
        { userId: req.user._id },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Redirect to frontend dashboard with token
      res.redirect(`http://localhost:5173/auth-callback?token=${token}&redirect=/dashboard`);
    } catch (error) {
      console.error('Google auth callback error:', error);
      res.redirect('/signin?error=google_auth_failed');
    }
  }
];

/**
 * User logout
 * @route POST /api/auth/logout
 */
exports.logout = (req, res) => {
  // Since we're using JWT, the actual logout happens on the client side
  // by removing the token. Server can't invalidate JWTs.
  // In a production app, you'd implement a token blacklist with Redis
  res.json({ message: 'Logged out successfully' });
};