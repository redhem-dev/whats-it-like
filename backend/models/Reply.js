const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const replySchema = new Schema({
  postId: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  authorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
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
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Method to check if a user has already voted
replySchema.methods.hasUserVoted = function(userId) {
  return this.votes.voterIds.includes(userId);
};

// Method to handle a vote
replySchema.methods.registerVote = function(userId, voteValue) {
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

const Reply = mongoose.model('Reply', replySchema);

module.exports = Reply;
