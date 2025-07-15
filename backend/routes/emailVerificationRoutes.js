const express = require('express');
const router = express.Router();
const emailVerificationController = require('../controllers/emailVerificationController');

// Send verification code
router.post('/send', emailVerificationController.sendCode);

// Verify code
router.post('/verify', emailVerificationController.verifyCode);

// Resend verification code
router.post('/resend', emailVerificationController.resendCode);

module.exports = router;
