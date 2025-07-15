/**
 * Controller for ID verification related endpoints
 * Specialized for Bosnian ID card verification only
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ocrService = require('../services/ocrService');
const countryIdService = require('../services/countryIdService');
const scriptConverter = require('../utils/scriptConverter');
const { hashIdNumber } = require('../utils/idHasher');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/temp');
    if (!fs.existsSync(uploadDir)){
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Unique filename to prevent collisions
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'id-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: function(req, file, cb) {
    // Accept only images - check both MIME type and file extension
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const allowedExtRegex = /\.(jpg|jpeg|png|gif|webp)$/i;
    
    // Check if MIME type is valid
    const isValidMimeType = allowedMimeTypes.includes(file.mimetype);
    
    // Check if file extension is valid
    const isValidExtension = allowedExtRegex.test(file.originalname);
    
    // Accept if either MIME type or extension is valid (more flexible)
    if (isValidMimeType || isValidExtension) {
      return cb(null, true);
    }
    
    // Otherwise reject
    return cb(new Error('Only image files are allowed (JPG, JPEG, PNG, GIF, WEBP)'), false);
  }
});

/**
 * Upload and process ID card image with country-specific verification
 * @route POST /api/verify/upload-id
 * @access Private
 */
exports.uploadIdCard = async (req, res) => {
  try {
    // Define a single file upload middleware
    const uploadMiddleware = upload.single('idCard');
    
    // Handle the upload
    uploadMiddleware(req, res, async function(err) {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      
      // Only supporting Bosnian IDs now
      const country = 'BA';
      const filePath = req.file.path;

      // Process the uploaded ID card
      let extractedData;
      
      try {
        // Check if file was uploaded
        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: 'No file uploaded'
          });
        }
        
        // Validate file is an image
        if (!req.file.mimetype.startsWith('image/')) {
          // Remove the invalid file
          fs.unlinkSync(req.file.path);
          
          return res.status(400).json({
            success: false,
            message: 'Uploaded file must be an image'
          });
        }
        
        // Process Bosnian ID card
        
        // Process the ID card image with country-specific OCR
        try {
          // Extract text from ID card image using OCR
          const baseData = await ocrService.processIdCard(req.file.path);
          
          if (!baseData || !baseData.rawText) {
            throw new Error('OCR failed to extract text from ID card');
          }
          
          // We're only processing Bosnian IDs now
          const finalCountry = 'BA';
          
          // Process Bosnian ID extraction
          const countrySpecificData = countryIdService.extractIdCardData(baseData.rawText);
          
          // Use the new country-specific extraction result
          let extractedIdNumber = countrySpecificData.idNumber;
          const extractedName = {
            firstName: countrySpecificData.firstName,
            lastName: countrySpecificData.lastName,
            fullName: countrySpecificData.fullName
          };
          
          // Continue with Bosnian ID extraction
          
          // CRITICAL VALIDATION: Validate country-specific ID format
          if (extractedIdNumber) {
            // Validate Bosnian ID format
            const isValidId = /^[0-9A-Z]{7,12}$/.test(extractedIdNumber) && 
                            !containsBannedWords(extractedIdNumber);
            
            if (!isValidId) {
              console.error(`Invalid Bosnian ID format:`, extractedIdNumber);
              extractedIdNumber = null; // Discard invalid ID
            }
          }
          
          // Helper function to check for banned words
          function containsBannedWords(text) {
            if (!text) return false;
            
            const bannedWords = ['iskaznica', 'osobna', 'karta', 'licna', 'lična', 'identity', 'card'];
            const lowerText = text.toLowerCase();
            
            for (const word of bannedWords) {
              if (lowerText.includes(word)) {
                console.error(`⚠️ CRITICAL ERROR: ID contains banned word "${word}":`, text);
                return true;
              }
            }
            
            return false;
          }
          
          // Use Bosnian extraction processing
          extractedData = {
            ...baseData,
            ...countrySpecificData,
            country: 'BA',
            countryName: 'Bosnia and Herzegovina',
            idNumber: extractedIdNumber || countrySpecificData.idNumber,
            firstName: extractedName.firstName || countrySpecificData.firstName,
            lastName: extractedName.lastName || countrySpecificData.lastName,
            fullName: extractedName.fullName || countrySpecificData.fullName || 
              (extractedName.firstName && extractedName.lastName ? 
                `${extractedName.firstName} ${extractedName.lastName}` : null)
          };
          
          // ID card processing complete
        } catch (error) {
          console.error('Error processing ID card:', error);
          extractedData = await ocrService.processIdCard(req.file.path);
        }
        
        // Clean up any SPECIMEN text from the data
        if (extractedData.fullName && extractedData.fullName.toUpperCase().includes('SPECIMEN')) {
          extractedData.fullName = extractedData.fullName.replace(/SPECIMEN/gi, '').trim();
        }
        
        if (extractedData.firstName && extractedData.firstName.toUpperCase().includes('SPECIMEN')) {
          extractedData.firstName = extractedData.firstName.replace(/SPECIMEN/gi, '').trim();
        }
        
        if (extractedData.lastName && extractedData.lastName.toUpperCase().includes('SPECIMEN')) {
          extractedData.lastName = extractedData.lastName.replace(/SPECIMEN/gi, '').trim();
        }
        
        // If we have first and last name but no full name, create it
        if (!extractedData.fullName && extractedData.firstName && extractedData.lastName) {
          extractedData.fullName = `${extractedData.firstName} ${extractedData.lastName}`;
        }
        
        // Store verification data in session
        exports.storeVerificationData(req, extractedData, country);
        
        // Verification data stored in session

        // Delete file after processing (important for security!)
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting temporary file:', err);
        });

        // Set country name for Bosnia
        const finalCountry = 'BA';
        const countryName = 'Bosnia and Herzegovina';
        
        // Fix names and ID number before returning
        const fullName = extractedData.fullName || 
                        (extractedData.firstName && extractedData.lastName ? 
                         `${extractedData.firstName} ${extractedData.lastName}` : 'Not detected');
        
        // CRITICAL VALIDATION: Final ID validation before returning to frontend
        let idNumber = extractedData.idNumber || null;
        
        // Validate Bosnian ID format
        if (idNumber) {          
          // Bosnia allows alphanumeric IDs
          if (!/^[0-9A-Z]{7,12}$/.test(idNumber)) {
            console.error('Invalid Bosnian ID format, rejecting:', idNumber);
            idNumber = null;
          }
        }
        
        // Check for banned words
        const bannedWords = ['iskaznica', 'osobna', 'karta', 'licna', 'lična', 'identity', 'card'];
        if (idNumber) {
          for (const word of bannedWords) {
            if (idNumber.toLowerCase().includes(word)) {
              console.error(`⚠️ CRITICAL ERROR: ID contains banned word "${word}", rejecting:`, idNumber);
              idNumber = null;
              break;
            }
          }
        }
        
        // Return placeholder if validation failed
        const finalIdNumber = idNumber || 'Not detected';
        
        // Send response to frontend
        
        res.json({ 
          success: true,
          message: 'ID card processed successfully',
          extractedData: {
            fullName: fullName,
            idNumber: finalIdNumber,
            country: finalCountry,
            countryName: countryName
          }
        });
      } catch (error) {
        console.error('ID verification error:', error);
        res.status(500).json({ message: 'Failed to process ID card' });
      }
    });
  } catch (error) {
    console.error('Error processing ID card:', error);
    res.status(500).json({ message: 'Error processing ID card' });
  }
};

exports.storeVerificationData = (req, extractedData, country) => {
  console.log('Storing verification data in session:', JSON.stringify(extractedData, null, 2).substring(0, 200) + '...');
  
  // Initialize verification data in session if not exists
  if (!req.session.verificationData) {
    req.session.verificationData = {};
  }
  
  // Store extracted data in session
  req.session.verificationData.extractedData = extractedData;
  req.session.verificationData.timestamp = Date.now();
  req.session.verificationData.country = 'BA'; // Only supporting Bosnian IDs
  
  // Store a copy in the global verification cache as backup
  const sessionId = req.session.id;
  global.verificationCache = global.verificationCache || {};
  global.verificationCache[sessionId] = {
    extractedData,
    timestamp: Date.now(),
    country: 'BA',
    expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours expiry
  };
  
  // Force session save to ensure data is persisted
  req.session.save(err => {
    if (err) {
      console.error('Error saving session:', err);
    } else {
      console.log('Session saved successfully, session ID:', req.session.id);
    }
  });
};

/**
 * Verify user provided data against extracted ID card data
 * Uses enhanced verification to strictly validate that user input matches OCR data
 * @route POST /api/verify/match-data
 */

/**
 * Check verification status
 * @route GET /api/verify/status
 */
exports.checkVerificationStatus = (req, res) => {
  const isVerified = req.session && req.session.isVerified;
  res.json({ verified: !!isVerified });
};

/**
 * Process ID verification for Google-authenticated users
 * @route POST /api/verify/google-user
 */
exports.verifyGoogleUser = async (req, res) => {
  try {
    const { tempToken, idNumber: rawIdNumber, firstName, lastName, email, idVerified } = req.body;

    // We only support Bosnian IDs now
    const country = 'BA';
    
    // Validate Bosnian ID format
    let idNumber = rawIdNumber;
    if (idNumber) {
      // Validate using Bosnian ID rules
      const isValidId = validateBosnianIdFormat(idNumber);
      
      if (!isValidId.valid) {
        console.error('Invalid Bosnian ID format:', idNumber);
        return res.status(400).json({
          success: false,
          message: isValidId.message || 'Invalid ID number format for Bosnian ID card.'
        });
      }
    }
    
    // Helper function to validate Bosnian ID format
    function validateBosnianIdFormat(id) {
      // Check for banned words first
      const bannedWords = ['iskaznica', 'osobna', 'karta', 'licna', 'lična', 'identity', 'card'];
      for (const word of bannedWords) {
        if (id.toLowerCase().includes(word)) {
          return { 
            valid: false, 
            message: `Invalid ID detected. ID should not contain text like "${word}".` 
          };
        }
      }
      
      // Bosnian IDs can be alphanumeric (7-12 characters)
      if (!/^[0-9A-Z]{7,12}$/i.test(id)) {
        return { 
          valid: false, 
          message: 'Invalid Bosnian ID format. ID should be 7-12 alphanumeric characters.' 
        };
      }
      
      // If we got here, the ID is valid
      return { valid: true };
    }
    
    // Detailed validation with specific error messages
    const validationErrors = [];
    
    if (!tempToken) validationErrors.push('verification token');
    if (!idNumber) validationErrors.push('ID card number');
    if (!firstName) validationErrors.push('first name');
    if (!lastName) validationErrors.push('last name');
    if (!email) validationErrors.push('email');
    if (idVerified !== true) validationErrors.push('ID verification confirmation');
    
    if (validationErrors.length > 0) {
      const missingFields = validationErrors.join(', ');
      console.log(`Validation failed. Missing fields: ${missingFields}`);
      
      return res.status(400).json({
        success: false,
        message: `Verification failed: Missing ${missingFields}`,
        details: 'All fields are required to complete registration'
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

    const User = require('../models/User');
    const jwt = require('jsonwebtoken');

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

    // FINAL SECURITY CHECK: Revalidate ID number format with country-specific rules
    if (idNumber) {
      // We already defined validateBosnianIdFormat earlier in this function
      // Reuse it for consistency
      const finalValidation = validateBosnianIdFormat(idNumber);
      
      if (!finalValidation.valid) {
        console.error(`⚠️ FINAL SECURITY CHECK: Invalid Bosnian ID format:`, idNumber);
        return res.status(400).json({
          success: false,
          message: finalValidation.message || 'Invalid ID number format detected at final security check.'
        });
      }
      
      console.log(`ID validation passed for Bosnian ID format`);
    }
    
    // Hash the ID number for GDPR compliance
    const idHash = hashIdNumber(idNumber);
    
    // Create new user with Google data and hashed ID
    // Prioritize data from request body, fall back to session data if needed
    const newUser = new User({
      googleId: tempGoogleUser.googleId,
      email: email || tempGoogleUser.email,
      firstName: firstName || tempGoogleUser.firstName,
      lastName: lastName || tempGoogleUser.lastName,
      idHash: idHash, // Store hash instead of raw ID
      idCountry: 'BA', // Store detected country or fallback to default
      verified: true,
      emailVerified: true // Google email is already verified
    });

    // Calculate initials for consistent avatar display
    const userFirstName = firstName || tempGoogleUser.firstName;
    const userLastName = lastName || tempGoogleUser.lastName;
    const userEmail = email || tempGoogleUser.email;
    
    // Follow the established pattern for avatar initials
    newUser.initials = (userFirstName && userLastName) ? 
      `${userFirstName[0]}${userLastName[0]}`.toUpperCase() : 
      (userEmail ? `${userEmail[0]}${userEmail[1] || ''}`.toUpperCase() : '??');

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
};

/**
 * Check Google verification session validity
 * @route GET /api/verify/google-session
 */
exports.checkGoogleSession = (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({
        valid: false,
        message: 'No verification token provided'
      });
    }
    
    console.log('Checking Google session with token:', token);
    console.log('Session data:', req.session);
    
    // Verify temp token matches session token
    const isValid = req.session && 
                   req.session.tempToken && 
                   req.session.tempGoogleUser &&
                   req.session.tempToken === token;
    
    if (isValid) {
      const googleUser = req.session.tempGoogleUser;
      
      // Calculate initials for avatar consistency if not already present
      if (!googleUser.initials) {
        googleUser.initials = (googleUser.firstName && googleUser.lastName) ? 
          `${googleUser.firstName[0]}${googleUser.lastName[0]}`.toUpperCase() : 
          (googleUser.email ? `${googleUser.email[0]}${googleUser.email[1] || ''}`.toUpperCase() : '??');
      }
      
      console.log('Valid Google session, returning user data:', googleUser);
      
      // Return Google user data stored in session
      return res.status(200).json({
        valid: true,
        googleUser: {
          email: googleUser.email,
          firstName: googleUser.firstName,
          lastName: googleUser.lastName,
          initials: googleUser.initials
        }
      });
    } else {
      console.log('Invalid Google session token');
      return res.status(401).json({
        valid: false,
        message: 'Invalid or expired Google verification session'
      });
    }
  } catch (error) {
    console.error('Error checking Google session:', error);
    return res.status(500).json({
      valid: false,
      message: 'Server error checking Google verification session'
    });
  }
};

// All functions are now exported inline
/**
 * Verify user provided data against extracted ID card data
 * Uses enhanced verification to strictly validate that user input matches OCR data
 * @route POST /api/verify/match-data
 */
exports.verifyUserData = async (req, res) => {
  try {
    // Log request info safely
    console.log('verifyUserData request received');
    console.log('Request body keys:', Object.keys(req.body || {}));
    
    // Check environment for production-specific handling
    const isProd = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'prod';
    console.log(`Environment: ${isProd ? 'production' : 'development'}`);
    
    // Safety check for request body
    if (!req.body) {
      console.error('Request body is missing');
      return res.status(400).json({
        success: false,
        message: 'Request body is required'
      });
    }
    
    // Ensure global cache exists in development (not used in production)
    if (!isProd && typeof global.verificationCache === 'undefined') {
      console.log('Initializing global verification cache');
      global.verificationCache = {};
    }
    
    // Safety check for session
    if (!req.session) {
      console.warn('Session object is undefined, creating fallback');
      req.session = { id: 'fallback-' + Date.now() };
    }
    
    const { firstName, lastName, idNumber: rawIdNumber, country: inputCountry } = req.body;
    
    // Validate input - collect missing fields for better error message
    const missingFields = [];
    if (!firstName) missingFields.push('firstName');
    if (!lastName) missingFields.push('lastName');
    if (!rawIdNumber) missingFields.push('idNumber');
    
    if (missingFields.length > 0) {
      console.log(`Match data validation failed. Missing fields: ${missingFields.join(', ')}`);
      return res.status(400).json({ 
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')} are required`,
        details: 'All fields must be provided for ID verification'
      });
    }
    
    // ID validation based on country
    let idNumber = rawIdNumber;
    const country = inputCountry || (req.body.extractedDataBackup?.country) || 'BA';
    
    // Validate ID format based on country
    if (idNumber) {
      if (country === 'BA') {
        // Bosnia allows alphanumeric IDs
        if (!/^[0-9A-Z]{7,12}$/.test(idNumber)) {
          console.error('Invalid Bosnian ID format:', idNumber);
          return res.status(400).json({
            success: false,
            message: 'Invalid Bosnian ID format. ID must be 7-12 alphanumeric characters.'
          });
        }
      } else if (country === 'RS' || country === 'HR') {
        // Serbia and Croatia require numeric IDs
        if (!/^\d{9,13}$/.test(idNumber)) {
          console.error(`Invalid ${country} ID format:`, idNumber);
          return res.status(400).json({
            success: false,
            message: `Invalid ${country} ID format. ID must be 9-13 digits.`
          });
        }
      }
    }
    
    // Get session ID safely with fallback
    const sessionId = req.session?.id || `fallback-${Date.now()}`;
    console.log('Current session ID:', sessionId);
    
    // Retrieve verification data with environment-specific handling
    let sessionData = null;
    let dataSource = 'none';
    
    // PRODUCTION: Always prioritize request body data
    if (isProd && req.body.extractedDataBackup) {
      console.log('PRODUCTION: Using extracted data from request body');
      
      sessionData = {
        extractedData: req.body.extractedDataBackup || {},
        timestamp: Date.now(),
        country: country
      };
      
      dataSource = 'production-frontend-data';
      
      // Still try to save to session for consistency if possible
      if (req.session && typeof req.session.save === 'function') {
        try {
          req.session.verificationData = sessionData;
          req.session.save();
        } catch (err) {
          console.error('Session save error in production:', err);
        }
      }
    }
    // DEVELOPMENT: Try session first, then cache, then request body
    else {
      // Try session
      if (req.session && req.session.verificationData) {
        console.log('Using verification data from session');
        sessionData = req.session.verificationData;
        dataSource = 'session';
      }
      // Try global cache (dev only)
      else if (!isProd && global.verificationCache && global.verificationCache[sessionId]) {
        console.log('Using verification data from global cache');
        sessionData = global.verificationCache[sessionId];
        dataSource = 'global-cache';
        
        // Save to session for future use
        if (req.session && typeof req.session.save === 'function') {
          try {
            req.session.verificationData = sessionData;
            req.session.save();
          } catch (err) {
            console.error('Error saving cache data to session:', err);
          }
        }
      }
      // Finally try request body backup
      else if (req.body.extractedDataBackup) {
        console.log('Using extracted data backup from request');
        sessionData = {
          extractedData: req.body.extractedDataBackup || {},
          timestamp: Date.now(),
          country: country
        };
        
        dataSource = 'request-body-backup';
        
        // Save for future use
        if (req.session && typeof req.session.save === 'function') {
          try {
            req.session.verificationData = sessionData;
            req.session.save();
          } catch (err) {
            console.error('Error saving data to session:', err);
          }
        }
      }
    }
    
    // If still no data found, return error
    if (!sessionData) {
      console.error('No verification data found in any source');
      return res.status(400).json({ 
        success: false,
        message: 'No ID verification data found. Please upload your ID first.',
        sessionId: req.session?.id || 'unknown'
      });
    }
    
    // Process the verification data
    console.log(`Processing verification data from source: ${dataSource}`);
    
    // Extract data safely with fallbacks
    let extractedData = {};
    
    // Try to get data from the correct location
    if (sessionData.extractedData && typeof sessionData.extractedData === 'object') {
      extractedData = sessionData.extractedData;
    } else {
      extractedData = sessionData;
    }
    
    // Special handling for Google flow if applicable
    const isGoogleFlow = req.path?.includes('google') || req.body?.isGoogleFlow === true;
    
    if (isGoogleFlow && req.session) {
      const hasSessionInfo = !!req.session.googleAuthInfo;
      const hasVerification = !!req.session.googleVerification;
      
      if (!hasSessionInfo) {
        return res.status(401).json({
          success: false,
          message: 'No Google session found for Google registration flow'
        });
      }
      
      if (hasVerification) {
        const verificationData = req.session.googleVerification;
        
        // Check if the verification data matches the current request
        if (verificationData.firstName !== firstName || 
            verificationData.lastName !== lastName ||
            verificationData.idNumber !== idNumber) {
          
          return res.status(400).json({
            success: false,
            message: 'Verification data does not match session data'
          });
        }
      }
    }
    
    console.log('Verifying user data against OCR data');
    console.log('User input:', { firstName, lastName, idNumber });
    
    // Normalize ID numbers for comparison
    const normalizeId = (id) => {
      if (!id) return '';
      return String(id).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    };
    
    const normalizedInputId = normalizeId(idNumber);
    const normalizedOcrId = normalizeId(extractedData.idNumber);
    
    console.log('Normalized IDs for comparison:', {
      input: normalizedInputId,
      ocr: normalizedOcrId
    });
    
    // Check if the normalized IDs match
    const idMatchResult = normalizedInputId === normalizedOcrId;
    
    // Name matching - handle cases where first/last name might be switched
    // or stored differently in the OCR data
    let nameMatchResult = false;
    
    // Try different name matching strategies
    if (extractedData.firstName && extractedData.lastName) {
      // Direct match
      nameMatchResult = 
        firstName.toLowerCase() === extractedData.firstName.toLowerCase() &&
        lastName.toLowerCase() === extractedData.lastName.toLowerCase();
        
      // If that fails, try full name match (in case OCR parsed the name differently)
      if (!nameMatchResult && extractedData.fullName) {
        const inputFullName = `${firstName} ${lastName}`.toLowerCase();
        const ocrFullName = extractedData.fullName.toLowerCase();
        nameMatchResult = inputFullName === ocrFullName;
      }
    } else if (extractedData.fullName) {
      // Try to match against full name if that's all we have
      const inputFullName = `${firstName} ${lastName}`.toLowerCase();
      const ocrFullName = extractedData.fullName.toLowerCase();
      nameMatchResult = ocrFullName.includes(inputFullName) || inputFullName.includes(ocrFullName);
    }
    
    // Final verification result
    const isVerified = idMatchResult && nameMatchResult;
    
    // Store verification status in session for future reference
    req.session.isVerified = isVerified;
    req.session.verificationStatus = {
      verified: isVerified,
      timestamp: Date.now(),
      idMatch: idMatchResult,
      nameMatch: nameMatchResult,
      dataSource: dataSource
    };
    
    // Force session save to ensure verification status persists
    if (typeof req.session.save === 'function') {
      req.session.save();
    }
    
    // Return verification result
    return res.json({
      success: true,
      verified: isVerified,
      idMatch: idMatchResult,
      nameMatch: nameMatchResult,
      message: isVerified ? 
        'User data successfully verified against ID' : 
        'User data does not match ID information'
    });
  } catch (error) {
    console.error('Error in verification process:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during verification process',
      error: error.message
    });
  }
};
