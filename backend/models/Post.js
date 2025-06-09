const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Keep the point schema for future geospatial queries, but comment out for MVP
/*
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
*/

// Keep edit history for future use
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
  
  // Location information - simplified for MVP
  location: {
    country: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    }
    // Commented out for MVP, will add later
    /*
    coordinates: {
      type: pointSchema,
      required: false
    }
    */
  },
  
  // Status - keeping simple for MVP
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved' // Auto-approve for MVP
  },
  
  // AI Moderation - commented out for MVP
  /*
  moderationResult: {
    flagged: Boolean,
    categories: [String],
    score: Number
  },
  */
  
  // Voting
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
  
  // Reporting - commented out for MVP
  /*
  reportCount: {
    type: Number,
    default: 0
  },
  */
  
  // Edit history - commented out for MVP but kept for future
  editHistory: [editHistorySchema],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Automatically handle createdAt and updatedAt
});

// Method to check if a user has already voted
postSchema.methods.hasUserVoted = function(userId) {
  return this.votes.voterIds.includes(userId);
};

// Method to handle a vote
postSchema.methods.registerVote = function(userId, voteValue) {
  // If user has already voted, don't allow duplicate votes
  if (this.hasUserVoted(userId)) {
    return false;
  }
  
  // Register the vote
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
