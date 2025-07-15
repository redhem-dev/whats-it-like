const VerificationCode = require('../models/VerificationCode');
const User = require('../models/User');
const { sendVerificationCode } = require('../services/emailService');

/**
 * Generate a random 6-digit code
 * @returns {string} 6-digit code
 */
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send verification code to user's email
 * @route POST /api/verify/email/send
 */
exports.sendCode = async (req, res) => {
  try {
    const { email, userId } = req.body;
    
    if (!email || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Email and userId are required'
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user's email is already verified
    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Delete any existing codes for this user
    await VerificationCode.deleteMany({ userId });

    // Generate new code
    const code = generateVerificationCode();
    
    // Calculate expiry (15 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Save code to database
    const verificationCode = new VerificationCode({
      email,
      code,
      userId,
      expiresAt
    });
    await verificationCode.save();

    // Send email with code
    const emailResult = await sendVerificationCode(
      email,
      code,
      user.firstName
    );

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Verification code sent successfully',
      expiresAt
    });
  } catch (error) {
    console.error('Error sending verification code:', error);
    return res.status(500).json({
      success: false,
      message: 'Error sending verification code'
    });
  }
};

/**
 * Verify code entered by user
 * @route POST /api/verify/email/verify
 */
exports.verifyCode = async (req, res) => {
  try {
    const { email, code, userId } = req.body;

    if (!email || !code || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Email, code and userId are required'
      });
    }

    // Find verification code
    const verificationCode = await VerificationCode.findOne({
      email,
      userId
    });

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

    // Code is valid, update user
    await User.findByIdAndUpdate(userId, {
      emailVerified: true
    });

    // Delete the verification code
    await VerificationCode.deleteOne({ _id: verificationCode._id });

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Error verifying code:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying code'
    });
  }
};

/**
 * Resend verification code
 * @route POST /api/verify/email/resend
 */
exports.resendCode = async (req, res) => {
  try {
    const { email, userId } = req.body;

    if (!email || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Email and userId are required'
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete any existing codes
    await VerificationCode.deleteMany({ userId });

    // Generate new code
    const code = generateVerificationCode();
    
    // Calculate expiry (15 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Save code to database
    const verificationCode = new VerificationCode({
      email,
      code,
      userId,
      expiresAt
    });
    await verificationCode.save();

    // Send email with code
    const emailResult = await sendVerificationCode(
      email,
      code,
      user.firstName
    );

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Verification code resent successfully',
      expiresAt
    });
  } catch (error) {
    console.error('Error resending verification code:', error);
    return res.status(500).json({
      success: false,
      message: 'Error resending verification code'
    });
  }
};
