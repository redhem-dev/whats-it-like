const sgMail = require('@sendgrid/mail');

// Set SendGrid API key if available
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Store verification codes in memory for development when email sending fails
const verificationCodesCache = new Map();

/**
 * Send verification code to user's email
 * @param {string} email - User's email address
 * @param {string} code - 6-digit verification code
 * @param {string} name - User's name (optional)
 */
const sendVerificationCode = async (email, code, name = '') => {
  // Store code in memory cache for development/testing
  verificationCodesCache.set(email, code);
  
  // Log the code to console for development
  console.log(`======================================`);
  console.log(`VERIFICATION CODE for ${email}: ${code}`);
  console.log(`======================================`);
  
  try {
    // Log API key status (without revealing the actual key)
    if (process.env.SENDGRID_API_KEY) {
      console.log('SendGrid API key found, attempting to send email...');
    } else {
      console.log('Email sending skipped - using console output instead (no API key)');
      return { success: true, mock: true };
    }
    
    const msg = {
      to: email,
      from: process.env.EMAIL_FROM || 'noreply@whatsitlike.com',
      subject: 'Your Verification Code',
      text: `Your verification code is: ${code}\n\nThis code will expire in 15 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Email Verification</h2>
          <p>Hello ${name || 'there'},</p>
          <p>Your verification code is:</p>
          <div style="font-size: 24px; font-weight: bold; letter-spacing: 5px; padding: 15px; background-color: #f4f4f4; text-align: center; margin: 20px 0;">
            ${code}
          </div>
          <p>This code will expire in 15 minutes.</p>
          <p>If you did not request this code, please ignore this email.</p>
        </div>
      `
    };

    try {
      const response = await sgMail.send(msg);
      console.log('Email sent successfully:', response[0].statusCode);
      return { success: true };
    } catch (sendGridError) {
      console.error('SendGrid API error:', sendGridError);
      if (sendGridError.response) {
        console.error('SendGrid API error details:', sendGridError.response.body);
      }
      throw sendGridError; // Re-throw to be caught by the outer try/catch
    }
  } catch (error) {
    console.error('Email sending failed:', error);
    // Return success anyway since we have the fallback
    return { success: true, mock: true, error: error.message };
  }
};

/**
 * Get verification code from memory cache (for development/testing)
 * @param {string} email - User's email
 * @returns {string|null} - Verification code or null if not found
 */
const getVerificationCodeFromCache = (email) => {
  return verificationCodesCache.get(email) || null;
};

module.exports = {
  sendVerificationCode,
  getVerificationCodeFromCache
};
