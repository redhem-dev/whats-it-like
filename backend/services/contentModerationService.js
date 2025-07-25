const { Together } = require('together-ai');

const together = new Together({
  apiKey: process.env.TOGETHER_API_KEY,
});

class ContentModerationService {
  
  /**
   * Moderate post content using AI
   * @param {Object} postData - The post data to moderate
   * @returns {Object} Moderation result
   */
  async moderatePost(postData) {
    const { title, content, location } = postData;
    
    const system_prompt = `
      You are a content moderation expert for a social platform called "What's It Like" focused on location-based experiences in Bosnia and Herzegovina.
      
      Your task is to analyze user posts for:
      1. Malicious content (hate speech, threats, harassment)
      2. Inappropriate language (excessive profanity, vulgar content)
      3. Spam or promotional content
      4. Misinformation or deliberately false claims
      5. Content that violates community guidelines
      6. Off-topic content (not related to location-based experiences)
      
      IMPORTANT: This is a platform for authentic location experiences in Bosnia. Be culturally sensitive and understand that passionate opinions about local issues are normal.
      
      Respond ONLY with valid JSON. No extra text before or after.
    `;

    const user_prompt = `
      Analyze this post content and determine if it should be:
      - APPROVED: Safe for publication
      - FLAGGED: Needs human review (borderline content)
      - REJECTED: Violates community guidelines
      
      Post Data:
      Title: "${title}"
      Content: "${content}"
      Location: "${location}"
      
      Response format:
      {
        "decision": "APPROVED|FLAGGED|REJECTED",
        "confidence": 0.95,
        "reasons": ["specific reason if flagged/rejected"],
        "categories": ["hate_speech", "spam", "inappropriate_language", "misinformation", "off_topic"],
        "severity": "low|medium|high",
        "suggested_action": "Description of what should happen",
        "admin_alert": true/false
      }
      
      RESPOND ONLY WITH THE JSON OBJECT.
    `;

    try {
      const data = await together.chat.completions.create({
        messages: [
          { role: 'system', content: system_prompt },
          { role: 'user', content: user_prompt },
        ],
        model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
        temperature: 0.3, // Lower temperature for more consistent moderation
      });

      const response = data.choices[0].message.content;
      console.log('Content Moderation Raw Response:', response);

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in moderation response');
      }

      const moderationResult = JSON.parse(jsonMatch[0]);
      console.log('Parsed Moderation Result:', moderationResult);

      return {
        success: true,
        result: moderationResult
      };

    } catch (error) {
      console.error('Content moderation error:', error);
      
      // Fallback: If AI fails, flag for human review
      return {
        success: false,
        result: {
          decision: 'FLAGGED',
          confidence: 0.0,
          reasons: ['AI moderation system error'],
          categories: ['system_error'],
          severity: 'medium',
          suggested_action: 'Human review required due to system error',
          admin_alert: true
        },
        error: error.message
      };
    }
  }

  /**
   * Moderate comment/reply content
   * @param {Object} commentData - The comment data to moderate
   * @returns {Object} Moderation result
   */
  async moderateComment(commentData) {
    const { content, parentPostTitle } = commentData;
    
    const system_prompt = `
      You are moderating comments/replies on a Bosnia-focused location experience platform.
      Comments should be respectful and relevant to the original post.
      
      Focus on:
      1. Personal attacks or harassment
      2. Spam or irrelevant content  
      3. Excessive profanity
      4. Hate speech
      5. Off-topic discussions
      
      Be more lenient with comments than posts, but maintain community standards.
      Respond ONLY with valid JSON.
    `;

    const user_prompt = `
      Moderate this comment:
      
      Comment: "${content}"
      Original Post: "${parentPostTitle}"
      
      Response format:
      {
        "decision": "APPROVED|FLAGGED|REJECTED",
        "confidence": 0.95,
        "reasons": ["specific reason if flagged/rejected"],
        "severity": "low|medium|high",
        "admin_alert": true/false
      }
      
      RESPOND ONLY WITH THE JSON OBJECT.
    `;

    try {
      const data = await together.chat.completions.create({
        messages: [
          { role: 'system', content: system_prompt },
          { role: 'user', content: user_prompt },
        ],
        model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
        temperature: 0.3,
      });

      const response = data.choices[0].message.content;
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No valid JSON found in comment moderation response');
      }

      const moderationResult = JSON.parse(jsonMatch[0]);
      
      return {
        success: true,
        result: moderationResult
      };

    } catch (error) {
      console.error('Comment moderation error:', error);
      
      return {
        success: false,
        result: {
          decision: 'FLAGGED',
          confidence: 0.0,
          reasons: ['AI moderation system error'],
          severity: 'medium',
          admin_alert: true
        },
        error: error.message
      };
    }
  }

  /**
   * Log moderation decision for audit trail
   * @param {String} contentType - 'post' or 'comment'
   * @param {String} contentId - ID of the content
   * @param {Object} moderationResult - Result from AI moderation
   * @param {String} userId - User who created the content
   */
  async logModerationDecision(contentType, contentId, moderationResult, userId) {
    try {
      // You can store this in your database for audit trail
      const logEntry = {
        contentType,
        contentId,
        userId,
        decision: moderationResult.decision,
        confidence: moderationResult.confidence,
        reasons: moderationResult.reasons,
        severity: moderationResult.severity,
        timestamp: new Date(),
        aiModel: 'deepseek-ai/deepseek-llm-67b-chat'
      };

      console.log('Moderation Decision Logged:', logEntry);
      
      // TODO: Save to database if you want audit trail
      // await ModerationLog.create(logEntry);
      
      return logEntry;
    } catch (error) {
      console.error('Failed to log moderation decision:', error);
    }
  }
}

module.exports = new ContentModerationService();
