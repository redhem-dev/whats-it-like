const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const { moderateCommentContent } = require('../middleware/contentModeration'); // AI content moderation
const replyController = require('../controllers/replyController');

// Routes for replies within posts
// These will be mounted at /api/posts/:postId/replies
// GET /api/posts/:postId/replies - Get all replies for a post
router.get('/:postId/replies', optionalAuth, replyController.getRepliesByPostId);

// POST /api/posts/:postId/replies - Create a new reply
router.post('/:postId/replies', auth, moderateCommentContent, replyController.createReply);

module.exports = router;
