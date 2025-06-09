const Reply = require('../models/Reply');
const User = require('../models/User');
const Post = require('../models/Post');

/**
 * Create a new reply
 * @route POST /api/posts/:postId/replies
 * Requires authentication
 */
exports.createReply = async (req, res) => {
  try {
    const { content } = req.body;
    const { postId } = req.params;
    
    // Verify the post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Create new reply
    const reply = new Reply({
      postId,
      authorId: req.user._id,  // From auth middleware
      content
    });
    
    await reply.save();
    
    // Return the reply with populated author
    const populatedReply = await Reply.findById(reply._id)
      .populate('authorId', 'email firstName lastName');
    
    res.status(201).json(populatedReply);
  } catch (error) {
    console.error('Create reply error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get all replies for a post
 * @route GET /api/posts/:postId/replies
 * Public route
 */
exports.getRepliesByPostId = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    // Validate that the post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Get replies for this post
    const replies = await Reply.find({ postId })
      .sort({ createdAt: -1 }) // Newest first
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('authorId', 'email firstName lastName');
    
    // Get total count for pagination
    const totalReplies = await Reply.countDocuments({ postId });
    
    // If user is logged in, fetch their votes for these replies
    let userVotes = {};
    
    if (req.user) {
      const userWithVotes = await User.findById(req.user._id, 'votes');
      
      if (userWithVotes && userWithVotes.votes) {
        // Create a map of replyId -> vote value for quick lookups
        userWithVotes.votes.forEach(vote => {
          if (vote.replyId) {
            userVotes[vote.replyId.toString()] = vote.vote;
          }
        });
      }
    }
    
    // Add userVote field to each reply
    const repliesWithVotes = replies.map(reply => {
      const replyObj = reply.toObject();
      replyObj.userVote = userVotes[reply._id.toString()] || 0;
      return replyObj;
    });
    
    res.json({
      replies: repliesWithVotes,
      totalPages: Math.ceil(totalReplies / limit),
      currentPage: Number(page),
      totalReplies
    });
  } catch (error) {
    console.error('Get replies error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Vote on a reply
 * @route POST /api/replies/:id/vote
 * Requires authentication
 */
exports.voteOnReply = async (req, res) => {
  try {
    const { voteType } = req.body; // 1 for upvote, -1 for downvote, 0 for removing vote
    const replyId = req.params.id;
    
    // Validate vote type
    if (voteType !== 1 && voteType !== -1 && voteType !== 0) {
      return res.status(400).json({ message: 'Invalid vote type' });
    }
    
    const reply = await Reply.findById(replyId);
    
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }
    
    // Check if user has already voted
    const hasVoted = reply.votes.voterIds.includes(req.user._id);
    
    // Get user's current vote if any
    const userVote = hasVoted ? 
      await User.findOne({ 
        _id: req.user._id, 
        'votes.replyId': replyId 
      }, { 'votes.$': 1 }) : null;
    
    const currentVote = userVote?.votes[0]?.vote || 0;
    
    // Handle vote removal (voteType === 0)
    if (voteType === 0) {
      if (hasVoted) {
        // Remove the vote
        if (currentVote === 1) {
          reply.votes.upvotes = Math.max(0, reply.votes.upvotes - 1);
        } else if (currentVote === -1) {
          reply.votes.downvotes = Math.max(0, reply.votes.downvotes - 1);
        }
        
        // Remove user ID from voters list
        reply.votes.voterIds = reply.votes.voterIds.filter(
          id => id.toString() !== req.user._id.toString()
        );
        
        // Remove vote from user's voting history
        await User.findOneAndUpdate(
          { _id: req.user._id, 'votes.replyId': replyId },
          { $pull: { votes: { replyId: replyId } } }
        );
      } else {
        // User hasn't voted, nothing to remove
        return res.json({ 
          message: 'No vote to remove',
          upvotes: reply.votes.upvotes,
          downvotes: reply.votes.downvotes
        });
      }
    }
    // Update reply votes for new votes or vote changes
    else if (!hasVoted) {
      // First time voting
      if (voteType === 1) {
        reply.votes.upvotes += 1;
      } else {
        reply.votes.downvotes += 1;
      }
      reply.votes.voterIds.push(req.user._id);
      
      // Add vote to user's voting history
      await User.findByIdAndUpdate(req.user._id, {
        $push: { votes: { replyId, vote: voteType } }
      });
    } else if (currentVote !== voteType) {
      // Changing vote
      if (voteType === 1) {
        reply.votes.upvotes += 1;
        reply.votes.downvotes -= 1;
      } else {
        reply.votes.upvotes -= 1;
        reply.votes.downvotes += 1;
      }
      
      // Update user's vote in voting history
      await User.findOneAndUpdate(
        { _id: req.user._id, 'votes.replyId': replyId },
        { $set: { 'votes.$.vote': voteType } }
      );
    }
    
    await reply.save();
    
    res.json({ 
      message: 'Vote recorded successfully',
      upvotes: reply.votes.upvotes,
      downvotes: reply.votes.downvotes,
      userVote: voteType // Return the user's new vote status
    });
  } catch (error) {
    console.error('Vote on reply error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update a reply
 * @route PUT /api/replies/:id
 * Requires authentication + ownership
 */
exports.updateReply = async (req, res) => {
  try {
    const replyId = req.params.id;
    const { content } = req.body;
    
    // Find reply and verify ownership
    const reply = await Reply.findById(replyId);
    
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }
    
    // Check if user is the author
    if (reply.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this reply' });
    }
    
    // Update reply
    reply.content = content;
    reply.updatedAt = Date.now();
    await reply.save();
    
    res.json(reply);
  } catch (error) {
    console.error('Update reply error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete a reply
 * @route DELETE /api/replies/:id
 * Requires authentication + ownership
 */
exports.deleteReply = async (req, res) => {
  try {
    const replyId = req.params.id;
    
    // Find reply and verify ownership
    const reply = await Reply.findById(replyId);
    
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }
    
    // Check if user is the author
    if (reply.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this reply' });
    }
    
    // Delete reply
    await Reply.findByIdAndDelete(replyId);
    
    res.json({ message: 'Reply deleted successfully' });
  } catch (error) {
    console.error('Delete reply error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
