const User = require('../models/User');
const VerificationCode = require('../models/VerificationCode');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { hashIdNumber } = require('../utils/idHasher');
const { sendVerificationCode } = require('../services/emailService');
const { updateUserReputation } = require('../services/reputationService');

// Define frontend URL based on environment
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Default JWT secret if environment variable is not set
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * User signup controller
 * @route POST /api/auth/signup
 */
exports.signup = async (req, res) => {
  try {
    const { email, password, firstName, lastName, idNumber } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // STRICT ID verification check - always required except in test env
    if (process.env.NODE_ENV !== 'test') {
      if (!req.session || !req.session.isVerified) {
        return res.status(403).json({ 
          message: 'ID verification required before registration. Please verify your identity first.'
        });
      }
      
      // Additional check to ensure the ID provided matches the verified ID
      const verifiedIdInfo = req.session.verifiedIdInfo;
      if (!verifiedIdInfo || verifiedIdInfo.idNumber !== idNumber) {
        console.error('ID number mismatch during registration:', { 
          provided: idNumber,
          verified: verifiedIdInfo?.idNumber || 'None'
        });
        return res.status(403).json({
          message: 'The ID number provided does not match your verified ID. Please verify your ID again.'
        });
      }
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Hash the ID number before storing - GDPR compliant approach
    const idHash = hashIdNumber(idNumber);
    
    console.log('Creating new user with hashed ID');
    
    // Get country from session verification or default to BA
    const idCountry = req.session?.verifiedIdInfo?.country || 'BA';
    
    // Create new user with hashed ID instead of raw ID number
    user = new User({
      email,
      firstName,
      lastName,
      idHash,           // Store secure hash instead of raw ID number
      idCountry,        // Store country of the ID document
      passwordHash,
      // If we've passed ID verification, mark as verified
      verified: req.session?.isVerified || process.env.NODE_ENV === 'test',
      // Email is not verified yet
      emailVerified: false,
    });

    await user.save();
    
    // Clear verification data from session after successful registration
    if (req.session) {
      delete req.session.idVerification;
      delete req.session.isVerified;
    }

    // Generate verification code for email
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Calculate expiry (15 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Save verification code
    const verificationCode = new VerificationCode({
      email: user.email,
      code,
      userId: user._id,
      expiresAt
    });
    
    await verificationCode.save();

    // Send verification email
    await sendVerificationCode(user.email, code, user.firstName);

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (excluding password) and token
    return res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        emailVerified: false,
        createdAt: user.createdAt
      },
      requiresEmailVerification: true,
      message: 'Account created successfully. Please check your email for verification code.'
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * User login controller
 * @route POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if account is locked
    if (user.isLocked()) {
      return res.status(403).json({ message: 'Account is temporarily locked. Try again later.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      // Increment login attempts
      user.loginAttempts += 1;
      
      // Lock account if too many failed attempts (5 attempts)
      if (user.loginAttempts >= 5) {
        // Lock for 30 minutes
        user.lockUntil = Date.now() + 30 * 60 * 1000;
      }
      
      await user.save();
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lastLogin = Date.now();
    
    // Check if email is verified
    if (!user.emailVerified) {
      await user.save();
      
      // Generate a new verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Calculate expiry (15 minutes from now)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      // Delete any existing codes
      await VerificationCode.deleteMany({ userId: user._id });

      // Save new verification code
      const verificationCode = new VerificationCode({
        email: user.email,
        code,
        userId: user._id,
        expiresAt
      });
      
      await verificationCode.save();

      // Send verification email
      await sendVerificationCode(user.email, code, user.firstName);

      return res.status(200).json({
        success: true,
        requiresEmailVerification: true,
        userId: user._id,
        email: user.email,
        message: 'Email not verified. A verification code has been sent to your email.'
      });
    }
    
    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        status: user.status,
        verified: user.verified || false,  // Include verification status
        emailVerified: user.emailVerified,
        idNumber: user.idNumber,  // Include ID number (masked in frontend if needed)
        lastLogin: user.lastLogin,
        personalInfo: {
          firstName: user.firstName || '',
          lastName: user.lastName || ''
        },
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get user profile
 * @route GET /api/auth/me
 * @requires auth
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        emailVerified: user.emailVerified,
        verified: user.verified,
        bio: user.bio,
        location: user.location,
        profession: user.profession,
        interests: user.interests,
        reputation: user.reputation,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update user profile
 * @route PUT /api/auth/profile
 * @requires auth
 */
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Fields that can be updated
    const updatableFields = [
      'firstName', 'lastName', 'bio', 'profession', 'interests',
      'location.country', 'location.city'
    ];
    
    // Update fields if provided
    updatableFields.forEach(field => {
      if (field.includes('.')) {
        // Handle nested fields like location.country
        const [parent, child] = field.split('.');
        if (req.body[parent] && req.body[parent][child] !== undefined) {
          if (!user[parent]) user[parent] = {};
          user[parent][child] = req.body[parent][child];
        }
      } else if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        bio: user.bio,
        location: user.location,
        profession: user.profession,
        interests: user.interests,
        reputation: user.reputation,
        status: user.status,
        emailVerified: user.emailVerified,
        verified: user.verified,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get posts created by the user
 * @route GET /api/auth/my-posts
 * @requires auth
 */
exports.getUserPosts = async (req, res) => {
  try {
    // Import Post model here to avoid circular dependencies
    const Post = require('../models/Post');
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Find posts where authorId is the current user
    const posts = await Post.find({ authorId: req.user.userId })
      .sort({ createdAt: -1 }) // Most recent first
      .skip(skip)
      .limit(limit)
      .populate('authorId', 'firstName lastName email');
    
    // Count total posts for pagination
    const totalPosts = await Post.countDocuments({ authorId: req.user.userId });
    
    res.json({
      success: true,
      posts,
      pagination: {
        page,
        limit,
        totalPosts,
        totalPages: Math.ceil(totalPosts / limit)
      }
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get and update user reputation
 * @route GET /api/auth/reputation
 * @requires auth
 */
exports.getUserReputation = async (req, res) => {
  try {
    // First update the user's reputation based on their voting history
    const updatedUser = await updateUserReputation(req.user.userId);
    
    // Get additional reputation stats if needed
    const user = await User.findById(req.user.userId).select('reputation votes firstName lastName email createdAt');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Calculate additional stats
    const totalVotes = user.votes.length;
    const correctVotes = user.votes.filter(vote => vote.correctVote === true).length;
    const incorrectVotes = user.votes.filter(vote => vote.correctVote === false).length;
    
    res.json({
      success: true,
      reputation: {
        score: user.reputation.score,
        correctVotes: user.reputation.correctVotes,
        totalVotes: user.reputation.totalVotes,
        lastCalculated: user.reputation.lastCalculated,
        stats: {
          totalVotesCast: totalVotes,
          correctVotes,
          incorrectVotes
        }
      }
    });
  } catch (error) {
    console.error('Get user reputation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Verify email with code
 * @route POST /api/auth/verify-email
 */
exports.verifyEmail = async (req, res) => {
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

    // Create JWT token for auto-login
    const user = await User.findById(userId);
    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        emailVerified: true,
        verified: user.verified || false,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error verifying email:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying email'
    });
  }
};

/**
 * Get user's email verification status
 * @route GET /api/auth/verification-status
 * @requires auth
 */
exports.getVerificationStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      emailVerified: user.emailVerified,
      email: user.email
    });
  } catch (error) {
    console.error('Error getting verification status:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Resend verification code
 * @route POST /api/auth/resend-verification
 */
exports.resendVerification = async (req, res) => {
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

    // Delete any existing codes
    await VerificationCode.deleteMany({ userId });

    // Generate new code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
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
    console.error('Error resending verification code:', error);
    return res.status(500).json({
      success: false,
      message: 'Error resending verification code'
    });
  }
};

/**
 * Google OAuth authentication - Redirect to Google
 * @route GET /api/auth/google
 */
exports.googleAuth = passport.authenticate('google', {
  scope: ['email', 'profile']
});

/**
 * Google OAuth callback
 * @route GET /api/auth/google/callback
 */
exports.googleAuthCallback = [
  passport.authenticate('google', { session: false, failureRedirect: `${FRONTEND_URL}/signin` }),
  (req, res) => {
    try {
      // Generate JWT token for the authenticated Google user
      const token = jwt.sign(
        { userId: req.user.userId },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Get frontend URL from env var or use localhost in development
      const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
      
      // Redirect to frontend dashboard with token
      res.redirect(`${FRONTEND_URL}/auth-callback?token=${token}&redirect=/dashboard`);
    } catch (error) {
      console.error('Google auth callback error:', error);
      res.redirect(`${FRONTEND_URL}/signin?error=google_auth_failed`);
    }
  }
];

/**
 * User logout
 * @route POST /api/auth/logout
 */
exports.logout = (req, res) => {
  // Since we're using JWT, the actual logout happens on the client side
  // by removing the token. Server can't invalidate JWTs.
  // In a production app, you'd implement a token blacklist with Redis
  res.status(200).json({ message: 'Logged out successfully' });
};

/**
 * Get user's voting history
 * @route GET /api/auth/votes
 * @requires auth
 * @requires emailVerified
 */
exports.getUserVotes = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    if (!userId) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    // Find the user and populate their votes with post details
    const user = await User.findById(userId)
      .select('votes')
      .populate({
        path: 'votes.postId',
        select: 'title location createdAt authorId',
        populate: {
          path: 'authorId',
          select: 'firstName lastName email'
        }
      });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Format the votes data for the frontend
    let formattedVotes = [];
    
    if (user.votes && user.votes.length > 0) {
      formattedVotes = user.votes
        .filter(vote => vote.postId) // Filter out any votes where the post has been deleted
        .map(vote => ({
          _id: vote._id,
          title: vote.postId.title,
          vote: vote.vote, // 1 for upvote, -1 for downvote
          author: vote.postId.authorId,
          location: vote.postId.location,
          votedAt: vote.timestamp
        }));
    }
    
    // If no votes are found, return an empty array
    res.status(200).json({ votes: formattedVotes });
  } catch (error) {
    console.error('Error fetching user votes:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get user reputation data
 * @route GET /api/auth/user/:userId/reputation
 * @route GET /api/auth/reputation
 * @requires auth
 */
exports.getUserReputation = async (req, res) => {
  try {
    // Get userId from params or use the authenticated user's ID
    let userId = req.params.userId;
    
    // If no userId is provided in params, use the authenticated user's ID
    if (!userId && req.user && req.user.userId) {
      userId = req.user.userId;
    }
    
    if (!userId) {
      return res.status(400).json({ 
        message: 'User ID is required', 
        details: 'No userId parameter found in URL and no authenticated user available'
      });
    }
    
    // Find user by ID and get their reputation data
    const user = await User.findById(userId).select('firstName lastName email createdAt votes reputation');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user reputation first to ensure it's current
    const { updateUserReputation } = require('../services/reputationService');
    await updateUserReputation(userId);
    
    // Get the updated user data
    const updatedUser = await User.findById(userId).select('firstName lastName email createdAt votes reputation');
    
    // Calculate vote statistics for display
    const upvotes = updatedUser.votes ? updatedUser.votes.filter(vote => vote.vote === 1).length : 0;
    const downvotes = updatedUser.votes ? updatedUser.votes.filter(vote => vote.vote === -1).length : 0;
    const totalVotes = upvotes + downvotes;
    const correctVotes = updatedUser.reputation?.correctVotes || 0;
    const reputationScore = updatedUser.reputation?.score || 50;
    

    
    // Format user data for public consumption
    const userData = {
      userId: updatedUser._id,
      name: `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim() || null,
      email: updatedUser.email,
      memberSince: updatedUser.createdAt,
      reputation: {
        score: reputationScore, // The actual 1-100 reputation score
        total: totalVotes, // Total number of votes cast
        upvotes,
        downvotes,
        correctVotes
      }
    };
    
    res.status(200).json(userData);
  } catch (error) {
    console.error('Error fetching user reputation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Get posts by any user (public endpoint)
 * @route GET /api/auth/user/:userId/posts
 * @requires auth
 */
exports.getUserPostsById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Find user to verify they exist
    const user = await User.findById(userId).select('firstName lastName email');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const Post = require('../models/Post');
    
    // Fetch posts by this user with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const posts = await Post.find({ authorId: userId })
      .populate({
        path: 'authorId',
        select: 'firstName lastName email'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalPosts = await Post.countDocuments({ authorId: userId });
    
    res.json({
      posts: posts.map(post => ({
        _id: post._id,
        title: post.title,
        content: post.content,
        location: post.location,
        tags: post.tags,
        votes: post.votes,
        createdAt: post.createdAt,
        author: post.authorId
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
        hasNext: page < Math.ceil(totalPosts / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get voting history by any user (public endpoint)
 * @route GET /api/auth/user/:userId/votes
 * @requires auth
 */
exports.getUserVotesById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Find the user and populate their votes with post details
    const user = await User.findById(userId)
      .select('votes firstName lastName email')
      .populate({
        path: 'votes.postId',
        select: 'title location createdAt authorId',
        populate: {
          path: 'authorId',
          select: 'firstName lastName email'
        }
      });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Format the votes data for the frontend
    let formattedVotes = [];
    
    if (user.votes && user.votes.length > 0) {
      formattedVotes = user.votes
        .filter(vote => vote.postId) // Filter out any votes where the post has been deleted
        .map(vote => ({
          _id: vote._id,
          postId: vote.postId._id,
          title: vote.postId.title,
          vote: vote.vote, // 1 for upvote, -1 for downvote
          author: vote.postId.authorId,
          location: vote.postId.location,
          votedAt: vote.timestamp,
          correctVote: vote.correctVote
        }))
        .sort((a, b) => new Date(b.votedAt) - new Date(a.votedAt)); // Sort by most recent first
    }
    
    res.status(200).json({ 
      votes: formattedVotes,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error fetching user votes:', error);
    res.status(500).json({ message: 'Server error' });
  }
};