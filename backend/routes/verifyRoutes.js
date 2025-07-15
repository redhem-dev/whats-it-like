const express = require('express');
const router = express.Router();
const multer = require('multer');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Configure multer for ID card image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/**
 * POST /api/verify/google-user
 * Process ID verification for Google-authenticated users and create their account
 */
router.post('/google-user', async (req, res) => {
  try {
    const { tempToken, idNumber, idVerified } = req.body;

    // Validate request
    if (!tempToken || !idNumber || idVerified !== true) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields or ID not verified' 
      });
    }

    // Verify the temp token matches the one in session
    if (!req.session.tempToken || req.session.tempToken !== tempToken) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired verification session' 
      });
    }

    // Get temporary Google user data from session
    const tempGoogleUser = req.session.tempGoogleUser;
    if (!tempGoogleUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'Google authentication data not found' 
      });
    }

    // Check if a user with this Google ID already exists
    const existingGoogleUser = await User.findOne({ googleId: tempGoogleUser.googleId });
    if (existingGoogleUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'User with this Google ID already exists' 
      });
    }

    // Check if a user with this email already exists
    const existingEmailUser = await User.findOne({ email: tempGoogleUser.email });
    if (existingEmailUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Create new user with Google data and ID number
    const newUser = new User({
      googleId: tempGoogleUser.googleId,
      email: tempGoogleUser.email,
      firstName: tempGoogleUser.firstName,
      lastName: tempGoogleUser.lastName,
      idNumber: idNumber,
      idVerified: true,
      emailVerified: true // Google email is already verified
    });

    await newUser.save();

    // Generate JWT token for the new user
    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET || 'whats-it-like-default-jwt-secret-key',
      { expiresIn: '7d' }
    );

    // Clear temporary session data
    delete req.session.tempGoogleUser;
    delete req.session.tempToken;

    return res.status(201).json({
      success: true,
      message: 'User successfully created after ID verification',
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        idVerified: newUser.idVerified
      }
    });
    
  } catch (error) {
    console.error('Error processing Google user verification:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while processing verification' 
    });
  }
});

module.exports = router;
