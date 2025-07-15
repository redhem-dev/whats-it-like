/**
 * Routes for ID verification endpoints
 */
const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');

// ID card upload and processing endpoint
router.post('/upload-id', verificationController.uploadIdCard);

// Verify user data against extracted ID card data
router.post('/match-data', verificationController.verifyUserData);

// Check verification status
router.get('/status', verificationController.checkVerificationStatus);

// Handle Google user verification after ID check
router.post('/google-user', verificationController.verifyGoogleUser);

// Check Google verification session validity
router.get('/google-session', verificationController.checkGoogleSession);

module.exports = router;
