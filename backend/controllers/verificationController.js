/**
 * Controller for ID verification related endpoints
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ocrService = require('../services/ocrService');

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
 * Upload and process ID card image
 * @route POST /api/verify/upload-id
 */
exports.uploadIdCard = [
  upload.single('idCard'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      console.log('ID card uploaded:', req.file.path);

      // Process the uploaded ID card
      const filePath = req.file.path;
      let extractedData;
      
      try {
        // Define which fields to extract based on registration needs
        const ocrOptions = {
          extractName: true,
          extractIdNumber: true,
          extractDateOfBirth: false, // Only extract what we need for verification
          extractAddress: false,
          // Add any custom keywords specific to your country's ID format
          idNumberKeywords: ['id', 'number', 'identification', 'document no', 'no.', 'ID#']
        };
        
        extractedData = await ocrService.processIdCard(filePath, ocrOptions);
      } catch (ocrError) {
        console.error('Error processing ID card with OCR service:', ocrError);
        
        // Handle common Google Cloud API errors
        if (ocrError.message && ocrError.message.includes('billing')) {
          return res.status(500).json({ 
            message: 'OCR service billing configuration error. Please contact support.'
          });
        }
        
        if (ocrError.message && ocrError.message.includes('credentials')) {
          return res.status(500).json({ 
            message: 'OCR service credentials error. Please check environment configuration.'
          });
        }
        
        // Delete the uploaded file
        try {
          fs.unlinkSync(filePath);
          console.log('Temporary file deleted after error');
        } catch (unlinkError) {
          console.error('Error deleting file after OCR error:', unlinkError);
        }
        
        return res.status(500).json({ 
          message: 'Error processing ID card. Please try again or use a clearer image.'
        });
      }

      // Store in session for later verification
      if (!req.session) {
        req.session = {};
      }
      
      req.session.idVerification = {
        extractedData,
        timestamp: Date.now()
      };
      
      console.log('ID verification data stored in session');

      // Delete file after processing (important for security!)
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting temporary file:', err);
        else console.log('Temporary file deleted successfully');
      });

      res.json({ 
        success: true,
        message: 'ID card processed successfully',
        extractedData: {
          fullName: extractedData.fullName || 'Not detected',
          idNumber: extractedData.idNumber || 'Not detected'
        }
      });
    } catch (error) {
      console.error('ID verification error:', error);
      res.status(500).json({ 
        message: 'Failed to process ID card',
        error: error.message
      });
    }
  }
];

/**
 * Verify user provided data against extracted ID card data
 * Uses enhanced verification to strictly validate that user input matches OCR data
 * @route POST /api/verify/match-data
 */
exports.verifyUserData = async (req, res) => {
  try {
    const { firstName, lastName, idNumber } = req.body;
    
    // Validate input
    if (!firstName || !lastName || !idNumber) {
      return res.status(400).json({ 
        message: 'Missing required fields: firstName, lastName, and idNumber are required'
      });
    }
    
    // Check if verification data exists in session
    if (!req.session || !req.session.idVerification) {
      return res.status(400).json({ 
        message: 'No ID verification data found. Please upload your ID first.'
      });
    }
    
    // Check if verification data is recent (within 30 minutes)
    const thirtyMinutes = 30 * 60 * 1000;
    if (Date.now() - req.session.idVerification.timestamp > thirtyMinutes) {
      delete req.session.idVerification;
      return res.status(400).json({ 
        message: 'ID verification expired. Please upload your ID again.'
      });
    }
    
    // Compare user-provided data with OCR-extracted data using enhanced verification
    const verificationResult = ocrService.verifyUserInputMatchesOcr(
      { firstName, lastName, idNumber },
      req.session.idVerification.extractedData
    );
    
    if (verificationResult.success) {
      // If data matches, mark as verified in the session
      req.session.isVerified = true;
      return res.json({ 
        success: true, 
        message: 'Identity verified successfully',
        extractedData: req.session.idVerification.extractedData
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        message: verificationResult.message,
        mismatches: verificationResult.mismatches
      });
    }
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: 'Error verifying user data' });
  }
};

/**
 * Check verification status
 * @route GET /api/verify/status
 */
exports.checkVerificationStatus = (req, res) => {
  const isVerified = req.session && req.session.isVerified;
  res.json({ verified: !!isVerified });
};
