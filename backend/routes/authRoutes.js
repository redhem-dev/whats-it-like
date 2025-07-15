const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const emailVerified = require('../middleware/emailVerified');

// Public auth routes
router.post('/signup', userController.signup);
router.post('/login', userController.login);
router.post('/verify-email', userController.verifyEmail);
router.post('/resend-verification', userController.resendVerification);
router.get('/google', userController.googleAuth);
router.get('/google/callback', userController.googleAuthCallback);

// Protected auth routes (require authentication)
router.get('/me', auth, emailVerified, userController.getProfile);
router.put('/profile', auth, emailVerified, userController.updateProfile);
router.get('/my-posts', auth, emailVerified, userController.getUserPosts);
router.get('/reputation', auth, emailVerified, userController.getUserReputation); // Gets current user's reputation
router.get('/votes', auth, emailVerified, userController.getUserVotes);
router.post('/logout', auth, userController.logout);

// Email verification status route (only requires authentication)
router.get('/verification-status', auth, userController.getVerificationStatus);

// Test route for debugging auth
router.get('/test-auth', auth, (req, res) => {
  res.json({
    success: true,
    message: 'Authentication successful',
    user: req.user
  });
});

// Get user reputation data (for hover cards and profile viewing)
router.get('/user/:userId/reputation', auth, userController.getUserReputation);

// Get user posts by ID (for public profiles)
router.get('/user/:userId/posts', auth, userController.getUserPostsById);

// Get user votes by ID (for public profiles)
router.get('/user/:userId/votes', auth, userController.getUserVotesById);

module.exports = router;
