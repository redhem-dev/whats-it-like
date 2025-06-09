const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// Public auth routes
router.post('/signup', userController.signup);
router.post('/login', userController.login);
router.get('/google', userController.googleAuth);
router.get('/google/callback', userController.googleAuthCallback);

// Protected auth routes (require authentication)
router.get('/me', auth, userController.getProfile);
router.post('/logout', auth, userController.logout);

module.exports = router;
