const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  passwordHash: {
    type: String
  },
  googleId: {
    type: String
  },
  
  // Email verification - commented out for MVP
  /*
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String
  },
  */
  
  // ID document verification
  idNumber: {
    type: String,
    trim: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  verificationDate: {
    type: Date,
    default: null
  },
  
  // Password reset functionality
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  
  // Personal information extracted from ID document - commented out for MVP
  /*
  personalInfo: {
    firstName: {
      type: String
    },
    lastName: {
      type: String
    },
    idNumber: {
      type: String
    },
    documentHash: {
      type: String
    }
  },
  */
  
  // User's verified locations - commented out for MVP
  /*
  locations: [{
    country: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    verified: {
      type: Boolean,
      default: false
    },
    verificationMethod: {
      type: String,
      enum: ['GPS', 'IP', 'manual', 'other']
    },
    verificationDate: {
      type: Date,
      default: Date.now
    }
  }],
  */
  
  // Security features
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  
  // References
  /*
  posts: [{
    type: Schema.Types.ObjectId,
    ref: 'Post'
  }],
  */
  
  // Voting history
  votes: [{
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'Post'
    },
    replyId: {
      type: Schema.Types.ObjectId,
      ref: 'Reply'
    },
    vote: {
      type: Number,
      enum: [-1, 1]
    }
  }],
  
  // Timestamps and status
  status: {
    type: String,
    enum: ['active', 'banned', 'suspended'],
    default: 'active'
  }
}, { 
  timestamps: true, // Automatically adds createdAt and updatedAt fields
  toJSON: { 
    virtuals: true 
  },
  toObject: { 
    virtuals: true 
  }
});

// Add index for email uniqueness
userSchema.index({ email: 1 }, { unique: true });

// Add index for google ID
userSchema.index({ googleId: 1 }, { sparse: true });

// Commented out for MVP - ID document uniqueness
// userSchema.index({ 'personalInfo.idNumber': 1 }, { sparse: true });

// Add method to check if account is locked
userSchema.methods.isLocked = function() {
  // Check if account is locked
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

const User = mongoose.model('User', userSchema);

module.exports = User;
