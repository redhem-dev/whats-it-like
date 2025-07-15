const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const verificationCodeSchema = new Schema({
  email: { 
    type: String, 
    required: true, 
    index: true 
  },
  code: { 
    type: String, 
    required: true 
  },
  expiresAt: { 
    type: Date, 
    required: true 
  },
  attempts: { 
    type: Number, 
    default: 0 
  },
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '15m' // Auto-delete after 15 minutes
  }
});

// Index for faster lookups
verificationCodeSchema.index({ email: 1, userId: 1 });

module.exports = mongoose.model('VerificationCode', verificationCodeSchema);
