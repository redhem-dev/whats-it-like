/**
 * Test script to demonstrate AI moderation error messages for replies
 * This simulates what the frontend would receive when AI rejects a reply
 */

require('dotenv').config();
const express = require('express');
const { moderateCommentContent } = require('./middleware/contentModeration');

const app = express();
app.use(express.json());

// Mock a reply creation request that would be rejected by AI
const testReplyCreation = () => {
  console.log('🧪 Testing AI Moderation Error Messages for Replies\n');

  // Create a mock request object like what the frontend would send
  const req = {
    body: {
      content: "You're an idiot and your opinion is trash. Kill yourself."
    },
    params: {
      postId: '507f1f77bcf86cd799439011' // Mock post ID
    },
    user: {
      userId: '507f1f77bcf86cd799439012' // Mock user ID
    }
  };

  // Create a mock response object to capture what gets sent back
  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.responseData = data;
      console.log(`📡 Response Status: ${this.statusCode}`);
      console.log('📄 Response Body:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.details && data.details.reasons) {
        console.log('\n🎯 AI Detected Issues:');
        data.details.reasons.forEach((reason, index) => {
          console.log(`   ${index + 1}. ${reason}`);
        });
      }
      
      if (data.details && data.details.appeal_message) {
        console.log(`\n💬 User Guidance: ${data.details.appeal_message}`);
      }
      
      console.log('\n' + '='.repeat(60));
      return this;
    }
  };

  const next = () => {
    console.log('✅ Reply would have been approved - proceeding to controller');
  };

  console.log('📝 Testing Reply Content: "You\'re an idiot and your opinion is trash. Kill yourself."');
  console.log('🤖 Running AI Moderation...\n');

  // Run the moderation middleware
  moderateCommentContent(req, res, next);
};

// Test with a good reply too
const testGoodReply = () => {
  console.log('\n🧪 Testing with Good Reply Content\n');

  const req = {
    body: {
      content: "Thanks for sharing! I had a similar experience there."
    },
    params: {
      postId: '507f1f77bcf86cd799439011'
    },
    user: {
      userId: '507f1f77bcf86cd799439012'
    }
  };

  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.responseData = data;
      console.log(`📡 Response Status: ${this.statusCode}`);
      console.log('📄 Response Body:');
      console.log(JSON.stringify(data, null, 2));
      return this;
    }
  };

  const next = () => {
    console.log('✅ Reply approved by AI - proceeding to controller');
    console.log('💾 Reply would be saved to database');
    console.log('📤 Success response would be sent to frontend');
  };

  console.log('📝 Testing Reply Content: "Thanks for sharing! I had a similar experience there."');
  console.log('🤖 Running AI Moderation...\n');

  moderateCommentContent(req, res, next);
};

// Run the tests
console.log('🚀 AI Reply Moderation Error Message Demo\n');
console.log('This shows what error messages users will see when AI rejects their replies.\n');

setTimeout(() => {
  testReplyCreation();
  
  setTimeout(() => {
    testGoodReply();
  }, 3000);
}, 1000);
