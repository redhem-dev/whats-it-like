// To finish until the midterm (CRUD COMPLETE)

const Post = require('../models/Post');
const User = require('../models/User');

/**
 * Create a new post
 * @route POST /api/posts
 * Requires authentication
 */
exports.createPost = async (req, res) => {
  try {
    const { title, content, country, city, tags } = req.body;
    
    // Basic validation
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    if (!country || !city) {
      return res.status(400).json({ message: 'Country and city are required' });
    }
    
    // For MVP, we're skipping the AI moderation step
    // Note: In the full implementation, we would call an AI moderation API here
    
    const newPost = new Post({
      authorId: req.user._id,
      title,
      content,
      tags: Array.isArray(tags) ? tags : [], // Ensure tags is an array
      location: {
        country,
        city
      },
      status: 'approved', // Auto-approve for MVP
      votes: {
        upvotes: 0,
        downvotes: 0,
        voterIds: []
      }
    });
    
    const post = await newPost.save();
    
    // Add post reference to user's posts array
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { posts: post._id } }
    );
    
    res.status(201).json(post);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get all posts
 * @route GET /api/posts
 * Public route
 */
exports.getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, tag, country, city } = req.query;
    
    // Build query based on filters
    const query = { 
      status: 'approved' // Only return approved posts
    };
    
    // Filter by tag if provided
    if (tag) {
      query.tags = tag;
    }
    
    // Filter by location if provided
    if (country) {
      query['location.country'] = country;
    }
    
    if (city) {
      query['location.city'] = city;
    }
    
    // Pagination
    const posts = await Post.find(query)
      .sort({ createdAt: -1 }) // Newest first
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('authorId', 'email firstName lastName'); // Include author details
    
    // Get total count for pagination info
    const totalPosts = await Post.countDocuments(query);
    
    // If user is logged in, fetch their votes for these posts
    let userVotes = {};
    
    if (req.user) {
      const userWithVotes = await User.findById(req.user._id, 'votes');
      
      if (userWithVotes && userWithVotes.votes) {
        // Create a map of postId -> vote value for quick lookups
        userWithVotes.votes.forEach(vote => {
          if (vote.postId) {
            userVotes[vote.postId.toString()] = vote.vote;
          }
        });
      }
    }
    
    // Add userVote field to each post
    const postsWithVotes = posts.map(post => {
      const postObj = post.toObject();
      postObj.userVote = userVotes[post._id.toString()] || 0;
      return postObj;
    });
    
    res.json({
      posts: postsWithVotes,
      totalPages: Math.ceil(totalPosts / limit),
      currentPage: Number(page),
      totalPosts
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get a single post by ID
 * @route GET /api/posts/:id
 * Public route
 */
exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('authorId', 'email firstName lastName');
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Only return approved posts unless it's the author requesting
    if (post.status !== 'approved' && 
        (!req.user || post.authorId._id.toString() !== req.user._id.toString())) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // If user is logged in, check if they've voted on this post
    let userVote = 0;
    if (req.user) {
      // Find the user's vote for this post
      const userVoteRecord = await User.findOne(
        { _id: req.user._id, 'votes.postId': post._id },
        { 'votes.$': 1 }
      );
      
      if (userVoteRecord && userVoteRecord.votes.length > 0) {
        userVote = userVoteRecord.votes[0].vote;
      }
    }
    
    // Create a response object with post data and user's vote
    const response = {
      ...post.toObject(),
      userVote // Add this to the response (will be 0, 1, or -1)
    };
    
    res.json(response);
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update a post
 * @route PUT /api/posts/:id
 * Requires authentication + ownership
 */
exports.updatePost = async (req, res) => {
  try {
    const { title, content, tags, location } = req.body;
    
    // Find post
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user is the author
    if (post.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }
    
    // Store previous content in edit history
    const editHistory = {
      timestamp: new Date(),
      previousContent: post.content
    };
    
    // Update post
    post.title = title || post.title;
    post.content = content || post.content;
    post.tags = tags || post.tags;
    post.location = location || post.location;
    post.updatedAt = Date.now();
    post.editHistory.push(editHistory);
    post.version = post.version + 1;
    
    // For MVP, we're skipping the re-moderation step
    // Note: In the full implementation, we would call an AI moderation API here
    
    const updatedPost = await post.save();
    
    res.json(updatedPost);
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete a post
 * @route DELETE /api/posts/:id
 * Requires authentication + ownership
 */
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user is the author
    if (post.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }
    
    // Remove post
    await Post.findByIdAndDelete(req.params.id);
    
    // Remove post reference from user's posts array
    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { posts: post._id } }
    );
    
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Vote on a post
 * @route POST /api/posts/:id/vote
 * Requires authentication
 */
exports.voteOnPost = async (req, res) => {
  try {
    const { voteType } = req.body; // 1 for upvote, -1 for downvote, 0 for removing vote
    const postId = req.params.id;
    
    // Validate vote type
    if (voteType !== 1 && voteType !== -1 && voteType !== 0) {
      return res.status(400).json({ message: 'Invalid vote type' });
    }
    
    // For MVP, we're skipping the location verification
    // Note: In the full implementation, we would verify the user's location here
    
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user has already voted
    const hasVoted = post.votes.voterIds.includes(req.user._id);
    
    // Get user's current vote if any
    const userVote = hasVoted ? 
      await User.findOne({ 
        _id: req.user._id, 
        'votes.postId': postId 
      }, { 'votes.$': 1 }) : null;
    
    const currentVote = userVote?.votes[0]?.vote || 0;
    
    // Handle vote removal (voteType === 0)
    if (voteType === 0) {
      if (hasVoted) {
        // Remove the vote
        if (currentVote === 1) {
          post.votes.upvotes = Math.max(0, post.votes.upvotes - 1);
        } else if (currentVote === -1) {
          post.votes.downvotes = Math.max(0, post.votes.downvotes - 1);
        }
        
        // Remove user ID from voters list
        post.votes.voterIds = post.votes.voterIds.filter(
          id => id.toString() !== req.user._id.toString()
        );
        
        // Remove vote from user's voting history
        await User.findOneAndUpdate(
          { _id: req.user._id, 'votes.postId': postId },
          { $pull: { votes: { postId: postId } } }
        );
      } else {
        // User hasn't voted, nothing to remove
        return res.json({ 
          message: 'No vote to remove',
          upvotes: post.votes.upvotes,
          downvotes: post.votes.downvotes
        });
      }
    }
    // Update post votes for new votes or vote changes
    else if (!hasVoted) {
      // First time voting
      if (voteType === 1) {
        post.votes.upvotes += 1;
      } else {
        post.votes.downvotes += 1;
      }
      post.votes.voterIds.push(req.user._id);
      
      // Add vote to user's voting history
      await User.findByIdAndUpdate(req.user._id, {
        $push: { votes: { postId, vote: voteType } }
      });
    } else if (currentVote !== voteType) {
      // Changing vote
      if (voteType === 1) {
        post.votes.upvotes += 1;
        post.votes.downvotes -= 1;
      } else {
        post.votes.upvotes -= 1;
        post.votes.downvotes += 1;
      }
      
      // Update user's vote in voting history
      await User.findOneAndUpdate(
        { _id: req.user._id, 'votes.postId': postId },
        { $set: { 'votes.$.vote': voteType } }
      );
    }
    
    await post.save();
    
    res.json({ 
      message: 'Vote recorded successfully',
      upvotes: post.votes.upvotes,
      downvotes: post.votes.downvotes,
      userVote: voteType // Return the user's new vote status
    });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Search posts by title
 * @route GET /api/posts/search
 */
exports.searchPosts = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Create a case-insensitive regular expression for the search term
    const searchRegex = new RegExp(query, 'i');
    
    // Find posts with titles containing the search term
    const posts = await Post.find({ 
      title: searchRegex,
      status: 'approved' // Only return approved posts
    })
    .populate('authorId', 'email') // Populate author information
    .sort({ createdAt: -1 }); // Sort by most recent
    
    // Format posts for client with user vote information
    const formattedPosts = posts.map(post => {
      // Check if the user has voted on this post
      let userVote = 0;
      if (req.user) {
        const userVoteRecord = req.user.votes.find(
          vote => vote.postId.toString() === post._id.toString()
        );
        userVote = userVoteRecord ? userVoteRecord.vote : 0;
      }
      
      return {
        _id: post._id,
        title: post.title,
        content: post.content,
        authorId: post.authorId,
        createdAt: post.createdAt,
        votes: post.votes,
        userVote: userVote
      };
    });

    res.json(formattedPosts);
  } catch (error) {
    console.error('Search posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
