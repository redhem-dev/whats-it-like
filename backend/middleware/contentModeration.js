const contentModerationService = require('../services/contentModerationService');

/**
 * Middleware to moderate post content before creation
 */
const moderatePostContent = async (req, res, next) => {
  try {
    const { title, content, location } = req.body;
    
    // AI moderation is always active for testing

    console.log('Moderating post content...');
    
    const moderationResult = await contentModerationService.moderatePost({
      title,
      content,
      location
    });

    if (!moderationResult.success) {
      // If AI service fails, reject the post to be safe
      console.log('AI moderation failed, rejecting post for safety');
      return res.status(500).json({
        success: false,
        message: 'Content moderation system is temporarily unavailable. Please try again later.',
        details: {
          reasons: ['System temporarily unavailable'],
          severity: 'high',
          appeal_message: 'Please wait a few minutes and try posting again.'
        }
      });
    }

    const { decision, confidence, reasons, severity } = moderationResult.result;

    // Log the decision
    await contentModerationService.logModerationDecision(
      'post',
      null, // Will be set after post creation
      moderationResult.result,
      req.user.id
    );

    switch (decision) {
      case 'APPROVED':
        console.log(`Post approved by AI (confidence: ${confidence})`);
        req.moderationResult = moderationResult.result;
        return next();

      case 'FLAGGED':
      case 'REJECTED':
        console.log(`Post rejected by AI: ${reasons.join(', ')} (Severity: ${severity})`);
        return res.status(400).json({
          success: false,
          message: 'Your post violates our community guidelines and cannot be published.',
          details: {
            reasons: reasons,
            severity: severity,
            confidence: confidence,
            appeal_message: 'Please review our community guidelines and try posting again with appropriate content.'
          }
        });

      default:
        // Unknown decision, reject to be safe
        console.log(`Post rejected due to unknown AI decision: ${decision}`);
        return res.status(400).json({
          success: false,
          message: 'Your post could not be processed. Please try again.',
          details: {
            reasons: ['Content could not be properly analyzed'],
            severity: 'medium',
            appeal_message: 'Please contact support if this issue persists.'
          }
        });
    }

  } catch (error) {
    console.error('Content moderation middleware error:', error);
    
    // On error, reject for safety
    return res.status(500).json({
      success: false,
      message: 'Content moderation system is temporarily unavailable. Please try again later.',
      details: {
        reasons: ['System temporarily unavailable'],
        severity: 'high',
        appeal_message: 'Please wait a few minutes and try posting again.'
      }
    });
  }
};

/**
 * Middleware to moderate comment content before creation
 */
const moderateCommentContent = async (req, res, next) => {
  try {
    const { content } = req.body;
    const { postId } = req.params;
    
    // AI moderation is always active for testing

    // Get parent post title for context (you'll need to implement this)
    // const parentPost = await Post.findById(postId);
    const parentPostTitle = 'Related Post'; // Placeholder

    console.log('Moderating comment content...');
    
    const moderationResult = await contentModerationService.moderateComment({
      content,
      parentPostTitle
    });

    if (!moderationResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Content moderation system is temporarily unavailable. Please try again later.',
        details: {
          reasons: ['System temporarily unavailable'],
          severity: 'high',
          appeal_message: 'Please wait a few minutes and try commenting again.'
        }
      });
    }

    const { decision, confidence, reasons, severity } = moderationResult.result;

    switch (decision) {
      case 'APPROVED':
        console.log(`Comment approved by AI (confidence: ${confidence})`);
        req.moderationResult = moderationResult.result;
        return next();

      case 'FLAGGED':
      case 'REJECTED':
        console.log(`Comment rejected by AI: ${reasons.join(', ')} (Severity: ${severity})`);
        return res.status(400).json({
          success: false,
          message: 'Your comment violates our community guidelines and cannot be posted.',
          details: {
            reasons: reasons,
            severity: severity,
            confidence: confidence,
            appeal_message: 'Please keep comments respectful and relevant to the discussion.'
          }
        });

      default:
        console.log(`Comment rejected due to unknown AI decision: ${decision}`);
        return res.status(400).json({
          success: false,
          message: 'Your comment could not be processed. Please try again.',
          details: {
            reasons: ['Content could not be properly analyzed'],
            severity: 'medium',
            appeal_message: 'Please contact support if this issue persists.'
          }
        });
    }

  } catch (error) {
    console.error('Comment moderation middleware error:', error);
    
    // On error, reject for safety
    return res.status(500).json({
      success: false,
      message: 'Content moderation system is temporarily unavailable. Please try again later.',
      details: {
        reasons: ['System temporarily unavailable'],
        severity: 'high',
        appeal_message: 'Please wait a few minutes and try commenting again.'
      }
    });
  }
};

module.exports = {
  moderatePostContent,
  moderateCommentContent
};
