const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const idDocumentSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  documentUrl: {
    type: String,
    required: true
  },
  documentType: {
    type: String,
    enum: ['passport', 'national_id', 'drivers_license', 'other'],
    required: true
  },
  
  // OCR processing
  ocrResult: {
    type: Schema.Types.Mixed,  // Stores any kind of data structure
    default: {}
  },
  
  // Verification status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  verificationAttempts: {
    type: Number,
    default: 1
  },
  rejectionReason: {
    type: String
  },
  
  // Document validity
  expiryDate: {
    type: Date
  },
  
  // Processing metadata
  processedAt: {
    type: Date
  },
  adminNotes: {
    type: String
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

// Add indexes for efficient querying
idDocumentSchema.index({ userId: 1 });
idDocumentSchema.index({ status: 1 });
idDocumentSchema.index({ documentType: 1 });

// Method to check if document is expired
idDocumentSchema.methods.isExpired = function() {
  if (!this.expiryDate) return false;
  return this.expiryDate < Date.now();
};

// Method to track verification attempts
idDocumentSchema.methods.incrementAttempts = function() {
  this.verificationAttempts += 1;
  return this.verificationAttempts;
};

const IDDocument = mongoose.model('IDDocument', idDocumentSchema);

module.exports = IDDocument;
