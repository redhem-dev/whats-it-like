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

module.exports = router;
