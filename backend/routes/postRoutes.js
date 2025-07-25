const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const auth = require('../middleware/auth'); // Required authentication middleware
const optionalAuth = require('../middleware/optionalAuth'); // Optional authentication middleware
const { moderatePostContent } = require('../middleware/contentModeration'); // AI content moderation

// Post routes with authentication
router.post('/', auth, moderatePostContent, postController.createPost);
router.get('/trending', optionalAuth, postController.getTrendingPosts); // Trending posts endpoint
router.get('/', optionalAuth, postController.getAllPosts); // Use optional auth
router.get('/search', optionalAuth, postController.searchPosts); // New search endpoint
router.get('/:id', optionalAuth, postController.getPostById); // Use optional auth
router.put('/:id', auth, moderatePostContent, postController.updatePost);
router.delete('/:id', auth, postController.deletePost);

// Voting routes
router.post('/:id/vote', auth, postController.voteOnPost);

module.exports = router;
