const express = require('express');
const session = require('express-session');
const passport = require('passport');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./config/database');
require('dotenv').config();
require('./config/auth');

// Import routes
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const replyRoutes = require('./routes/replyRoutes');
const individualReplyRoutes = require('./routes/individualReplyRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const emailVerificationRoutes = require('./routes/emailVerificationRoutes');
const locationRoutes = require('./routes/locationRoutes');
const testRoutes = require('./routes/testRoutes');

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());

// Configure CORS to allow credentials (cookies) for frontend-backend communication
app.use(cors({
  origin: 'http://localhost:5173', // Frontend URL
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configure sessions for ID verification
app.use(session({ 
  secret: process.env.SESSION_SECRET || 'temporarydevsecretshouldbereplaced', 
  resave: false, 
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    maxAge: 30 * 60 * 1000 // 30 minutes - enough time for ID verification process
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// Basic middleware for checking if user is logged in (for Passport session auth)
function isLoggedIn(req, res, next) {
  req.user ? next() : res.sendStatus(401);
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/posts', replyRoutes);
app.use('/api/replies', individualReplyRoutes);
app.use('/api/verify', verificationRoutes);
app.use('/api/verify/email', emailVerificationRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/test', testRoutes);

// Legacy Google auth routes (can be migrated to authRoutes later)
app.get('/', (req, res) => {
  res.send('<a href="/auth/google">Authenticate with Google</a>');
});

app.get('/auth/google', 
  passport.authenticate('google', {scope: ['email', 'profile']})
);

app.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // User authenticated via Google OAuth
    
    // If this is a temp user that needs ID verification (new Google user)
    if (req.user && req.user.requiresIdVerification) {

      
      // Store the Google profile data in the session for later use
      req.session.tempGoogleUser = {
        googleId: req.user.googleId,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        initials: req.user.initials || (req.user.firstName && req.user.lastName) ? 
          `${req.user.firstName[0]}${req.user.lastName[0]}`.toUpperCase() : 
          (req.user.email ? `${req.user.email[0]}${req.user.email[1] || ''}`.toUpperCase() : '??')
      };
      
      // Generate a temporary token for this verification session
      const tempToken = require('crypto').randomBytes(64).toString('hex');
      req.session.tempToken = tempToken;
      


      
      // Save the session before redirecting
      req.session.save(err => {
        if (err) {
          console.error('Error saving session:', err);
          return res.redirect('http://localhost:5173/signup?error=session_error');
        }
        
        // Redirect to ID verification page on the frontend
        return res.redirect(`http://localhost:5173/verify-id?token=${tempToken}&google=true`);
      });
    } else {
      // If user already exists in DB, generate JWT token
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { userId: req.user._id || req.user.id },
        process.env.JWT_SECRET || 'whats-it-like-default-jwt-secret-key',
        { expiresIn: '7d' }
      );
      
      // Redirect to frontend with token

      return res.redirect(`http://localhost:5173/auth-callback?token=${token}&redirect=/dashboard`);
    }
  }
);

app.get('/protected', isLoggedIn, (req, res) => {
  try {
    // Generate JWT token for the authenticated Google user
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: req.user._id },
      process.env.JWT_SECRET || 'whats-it-like-default-jwt-secret-key',
      { expiresIn: '7d' }
    );

    // Redirect to frontend with the token
    res.redirect(`http://localhost:5173/auth-callback?token=${token}&redirect=/dashboard`);
  } catch (error) {
    console.error('Google auth error:', error);
    res.redirect('http://localhost:5173/signin?error=auth_failed');
  }
});

// For development - show available routes
app.get('/api', (req, res) => {
  res.json({
    message: 'API is running',
    availableRoutes: {
      auth: [
        { method: 'POST', path: '/api/auth/signup', description: 'Register a new user' },
        { method: 'POST', path: '/api/auth/login', description: 'Login with email and password' },
        { method: 'GET', path: '/api/auth/me', description: 'Get current user profile' },
        { method: 'GET', path: '/api/auth/google', description: 'Google OAuth login (placeholder)' },
        { method: 'POST', path: '/api/auth/logout', description: 'Logout current user' }
      ],
      posts: [
        { method: 'GET', path: '/api/posts', description: 'Get all posts' },
        { method: 'GET', path: '/api/posts/:id', description: 'Get post by ID' },
        { method: 'POST', path: '/api/posts', description: 'Create a new post' },
        { method: 'PUT', path: '/api/posts/:id', description: 'Update a post' },
        { method: 'DELETE', path: '/api/posts/:id', description: 'Delete a post' },
        { method: 'POST', path: '/api/posts/:id/vote', description: 'Vote on a post' }
      ]
    }
  });
});

// Handle 404s
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: process.env.NODE_ENV === 'production' ? {} : err });
});

// Start server after MongoDB connects
mongoose.connection.once('open', () => {
  console.log('MongoDB connected');
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
  });
});

module.exports = app;
