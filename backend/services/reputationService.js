/**
 * Reputation Service
 * 
 * Implements the reputation system based on the formula:
 * Reputation(u) = 100 × ∑CorrectVotes(u) / TotalVotes(u)
 * 
 * Where:
 * - Reputation(u): User's reputation score on a scale of 1-100
 * - CorrectVotes(u): Number of votes where user u voted in alignment with the post's final truth rating
 * - TotalVotes(u): Total number of votes cast by user u
 * 
 * Additionally tracks PostTruthRating(p) = NumberOfUpvotes(p) / TotalVotes(p)
 */

const User = require('../models/User');
const Post = require('../models/Post');

/**
 * Calculate a user's reputation score
 * @param {Object} user - User document
 * @returns {Number} - Reputation score as percentage with 1 decimal place
 */
const calculateReputationScore = (user) => {
  // If user has no votes, return default score of 50
  if (!user.reputation || !user.reputation.totalVotes || user.reputation.totalVotes === 0) {
    return 50.0;
  }
  
  // Apply the formula: Reputation(u) = CorrectVotes(u) / TotalVotes(u)
  const correctVotes = user.reputation.correctVotes || 0;
  const totalVotes = user.reputation.totalVotes || 0;
  
  if (totalVotes === 0) {
    return 50.0;
  }
  
  // Calculate percentage and round to 1 decimal place
  const score = (correctVotes / totalVotes) * 100;
  const finalScore = Math.max(0, Math.min(100, Math.round(score * 10) / 10));
  
  return finalScore;
};

/**
 * Calculate a post's truth rating
 * @param {Object} post - Post document
 * @returns {Number} - Truth rating between 0-1
 */
const calculatePostTruthRating = (post) => {
  const totalVotes = (post.votes?.upvotes || 0) + (post.votes?.downvotes || 0);
  
  // If no votes, return neutral rating
  if (totalVotes === 0) {
    return 0.5; // Neutral rating
  }
  
  // PostTruthRating(p) = NumberOfUpvotes(p) / TotalVotes(p)
  return post.votes.upvotes / totalVotes;
};

/**
 * Update a user's reputation based on their voting history
 * @param {String} userId - User ID
 * @returns {Object} - Updated reputation data
 */
const updateUserReputation = async (userId) => {
  try {
    const user = await User.findById(userId).populate('votes.postId');
    if (!user) {
      return;
    }

    // Initialize reputation if it doesn't exist
    if (!user.reputation) {
      user.reputation = {
        score: 50.0,
        correctVotes: 0,
        totalVotes: 0,
        lastCalculated: new Date()
      };
    }

    // Re-evaluate ALL votes to ensure accuracy
    const allVotes = user.votes.filter(vote => vote.postId); // Only votes with valid posts

    let correctVotes = 0;
    let totalVotes = 0;

    // Evaluate each vote against the current post truth
    for (const vote of allVotes) {
      const post = await Post.findById(vote.postId);
      if (!post) continue;

      // Calculate post truth based on current vote counts
      const postUpvotes = post.votes?.upvotes || 0;
      const postDownvotes = post.votes?.downvotes || 0;
      const postTotalVotes = postUpvotes + postDownvotes;
      
      if (postTotalVotes === 0) continue; // Skip posts with no votes

      // Post truth: if more than 50% upvoted, it's "true", otherwise "false"
      const upvotePercentage = postUpvotes / postTotalVotes;
      const postTruth = upvotePercentage > 0.5;
      
      // User vote: 1 = upvote (saying it's true), -1 = downvote (saying it's false)
      const userSaysTrue = vote.vote === 1;
      
      // Vote is correct if user's assessment matches the community consensus
      const isCorrectVote = userSaysTrue === postTruth;
      
      // Update the vote record
      vote.correctVote = isCorrectVote;
      
      if (isCorrectVote) {
        correctVotes++;
      }
      totalVotes++;
    }

    // Update reputation totals
    user.reputation.correctVotes = correctVotes;
    user.reputation.totalVotes = totalVotes;
    user.reputation.score = calculateReputationScore(user);
    user.reputation.lastCalculated = new Date();



    await user.save();
    return user.reputation;
  } catch (error) {
    console.error('Error updating user reputation:', error);
    throw error;
  }
};

/**
 * Update reputation for all users who voted on a specific post
 * This should be called when a post receives new votes that might change its truth rating
 * @param {String} postId - Post ID
 */
const updateReputationForPostVoters = async (postId) => {
  try {
    // Find all users who voted on this post
    const users = await User.find({
      'votes.postId': postId
    });
    
    // Update reputation for each user
    for (const user of users) {
      await updateUserReputation(user._id);
    }
    
    return { success: true, usersUpdated: users.length };
  } catch (error) {
    console.error('Error updating reputation for post voters:', error);
    throw error;
  }
};

module.exports = {
  calculateReputationScore,
  calculatePostTruthRating,
  updateUserReputation,
  updateReputationForPostVoters
};
