const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reportSchema = new Schema({
  postId: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  reportingUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Report details
  reason: {
    type: String,
    required: true,
    enum: [
      'hate-speech', 
      'harassment', 
      'misinformation', 
      'violence', 
      'inappropriate-content',
      'spam',
      'other'
    ]
  },
  details: {
    type: String,
    trim: true
  },
  evidence: [{
    type: String  // URLs to screenshots or other evidence
  }],
  
  // Moderation process
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'actioned'],
    default: 'pending'
  },
  actionTaken: {
    type: String,
    enum: ['none', 'post_removed', 'post_edited', 'user_warned', 'user_suspended', 'user_banned', 'other'],
    default: 'none'
  },
  
  // Timestamps and notes
  reviewedAt: {
    type: Date
  },
  moderatorNotes: {
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
reportSchema.index({ postId: 1 });
reportSchema.index({ reportingUserId: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ reason: 1 });

// Virtual to check if report is processed
reportSchema.virtual('isProcessed').get(function() {
  return this.status !== 'pending';
});

// Method to mark report as reviewed
reportSchema.methods.markAsReviewed = function(actionTaken, moderatorNotes) {
  this.status = 'reviewed';
  this.actionTaken = actionTaken || 'none';
  this.moderatorNotes = moderatorNotes || '';
  this.reviewedAt = new Date();
  return this;
};

// Method to mark report as actioned
reportSchema.methods.markAsActioned = function(actionTaken, moderatorNotes) {
  this.status = 'actioned';
  this.actionTaken = actionTaken;
  this.moderatorNotes = moderatorNotes || '';
  this.reviewedAt = new Date();
  return this;
};

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
