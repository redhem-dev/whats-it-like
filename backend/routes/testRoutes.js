const express = require('express');
const router = express.Router();
const VerificationCode = require('../models/VerificationCode');
const { sendVerificationCode } = require('../services/emailService');
const mongoose = require('mongoose');

// Test endpoint for email verification
router.post('/email-verification', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Create a temporary user ID for testing
    const tempUserId = new mongoose.Types.ObjectId();
    
    // Calculate expiry (15 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Save code to database
    const verificationCode = new VerificationCode({
      email,
      code,
      userId: tempUserId,
      expiresAt
    });
    
    await verificationCode.save();

    // Send email with code
    const emailResult = await sendVerificationCode(email, code, 'Test User');

    return res.status(200).json({
      success: true,
      message: 'Verification code sent successfully',
      emailResult,
      testCode: code, // Only for testing
      expiresAt
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Error sending verification code',
      error: error.message
    });
  }
});

// Test endpoint to verify code
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and code are required'
      });
    }

    // Find verification code
    const verificationCode = await VerificationCode.findOne({ email });

    // Check if code exists
    if (!verificationCode) {
      return res.status(404).json({
        success: false,
        message: 'Verification code not found or expired'
      });
    }

    // Check if code is expired
    if (new Date() > verificationCode.expiresAt) {
      await VerificationCode.deleteOne({ _id: verificationCode._id });
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired'
      });
    }

    // Increment attempts
    verificationCode.attempts += 1;
    await verificationCode.save();

    // Check max attempts
    if (verificationCode.attempts > 3) {
      await VerificationCode.deleteOne({ _id: verificationCode._id });
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts. Please request a new code.'
      });
    }

    // Check if code matches
    if (verificationCode.code !== code) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code',
        attemptsLeft: 3 - verificationCode.attempts
      });
    }

    // Code is valid, delete it
    await VerificationCode.deleteOne({ _id: verificationCode._id });

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Error verifying code:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying code',
      error: error.message
    });
  }
});

module.exports = router;
