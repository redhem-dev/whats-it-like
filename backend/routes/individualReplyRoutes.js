const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const replyController = require('../controllers/replyController');

// These routes are for operations on individual replies
// They will be mounted at /api/replies

// POST /api/replies/:id/vote - Vote on a reply
router.post('/:id/vote', auth, replyController.voteOnReply);

// PUT /api/replies/:id - Update a reply
router.put('/:id', auth, replyController.updateReply);

// DELETE /api/replies/:id - Delete a reply
router.delete('/:id', auth, replyController.deleteReply);

// If you add any GET routes in the future, use optionalAuth for them
// Example: router.get('/:id', optionalAuth, replyController.getReplyById);

module.exports = router;
