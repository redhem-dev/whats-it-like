const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const pointSchema = new Schema({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point',
    required: true
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true
  }
});

const editHistorySchema = new Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  previousContent: {
    type: String,
    required: true
  }
});

const postSchema = new Schema({
  authorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  
  // Location information
  location: {
    country: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    coordinates: {
      type: pointSchema,
      index: '2dsphere' // Enables geospatial queries
    }
  },
  
  // Moderation status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  moderationResult: {
    flagged: {
      type: Boolean,
      default: false
    },
    categories: [{
      type: String,
      enum: ['hate-speech', 'violence', 'harassment', 'misinformation', 'other']
    }],
    score: {
      type: Number,
      default: 0
    }
  },
  
  // Voting information
  votes: {
    upvotes: {
      type: Number,
      default: 0
    },
    downvotes: {
      type: Number,
      default: 0
    },
    voterIds: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  
  reportCount: {
    type: Number,
    default: 0
  },
  
  // Version control for edits
  editHistory: [editHistorySchema],
  
  // For optimistic concurrency control
  version: {
    type: Number,
    default: 1
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
postSchema.index({ authorId: 1 });
postSchema.index({ status: 1 });
postSchema.index({ 'location.country': 1, 'location.city': 1 });
postSchema.index({ tags: 1 });

// Virtual for calculating total votes
postSchema.virtual('voteScore').get(function() {
  return this.votes.upvotes - this.votes.downvotes;
});

// Method to check if a user has already voted
postSchema.methods.hasUserVoted = function(userId) {
  return this.votes.voterIds.includes(userId);
};

// Method to handle a vote
postSchema.methods.registerVote = function(userId, voteValue) {
  // If user already voted, do nothing
  if (this.hasUserVoted(userId)) {
    return false;
  }
  
  // Otherwise, register the vote
  if (voteValue === 1) {
    this.votes.upvotes += 1;
  } else if (voteValue === -1) {
    this.votes.downvotes += 1;
  }
  
  this.votes.voterIds.push(userId);
  return true;
};

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
