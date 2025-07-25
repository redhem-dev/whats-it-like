/**
 * Test script for AI content moderation
 * Run with: node test-moderation.js
 */

require('dotenv').config();
const contentModerationService = require('./services/contentModerationService');

async function testModeration() {
  console.log('🚀 Testing AI Content Moderation System\n');

  // Test cases for posts
  const testPosts = [
    {
      title: "Great restaurant in Sarajevo",
      content: "Had an amazing meal at this local restaurant in Baščaršija. The ćevapi was delicious and the staff was very friendly. Highly recommend for tourists!",
      location: "Sarajevo, Bosnia and Herzegovina",
      expected: "APPROVED"
    },
    {
      title: "Terrible experience with locals",
      content: "I hate this stupid city and all the people here are idiots. Don't come to Bosnia, everyone is rude and the food sucks. What a waste of money!",
      location: "Sarajevo, Bosnia and Herzegovina", 
      expected: "REJECTED/FLAGGED"
    },
    {
      title: "BUY CHEAP VIAGRA NOW!!!",
      content: "Click here to buy cheap medications online! Best prices guaranteed! No prescription needed! Visit our website now for amazing deals!",
      location: "Sarajevo, Bosnia and Herzegovina",
      expected: "REJECTED"
    },
    {
      title: "Public transport review",
      content: "The bus system in Sarajevo has improved a lot. The new buses are clean and mostly on time. Still gets crowded during rush hour though.",
      location: "Sarajevo, Bosnia and Herzegovina",
      expected: "APPROVED"
    }
  ];

  console.log('📝 Testing Post Moderation:\n');

  for (let i = 0; i < testPosts.length; i++) {
    const post = testPosts[i];
    console.log(`Test ${i + 1}: "${post.title}"`);
    console.log(`Expected: ${post.expected}`);
    
    try {
      const result = await contentModerationService.moderatePost(post);
      
      if (result.success) {
        const { decision, confidence, reasons, severity } = result.result;
        console.log(`✅ Result: ${decision} (Confidence: ${confidence})`);
        if (reasons && reasons.length > 0) {
          console.log(`   Reasons: ${reasons.join(', ')}`);
        }
        if (severity) {
          console.log(`   Severity: ${severity}`);
        }
      } else {
        console.log(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ Exception: ${error.message}`);
    }
    
    console.log(''); // Empty line for spacing
  }

  // Test cases for comments
  const testComments = [
    {
      content: "Thanks for sharing! I had a similar experience there.",
      parentPostTitle: "Great restaurant in Sarajevo",
      expected: "APPROVED"
    },
    {
      content: "You're an idiot and your opinion is trash. Kill yourself.",
      parentPostTitle: "Public transport review",
      expected: "REJECTED"
    },
    {
      content: "I disagree, but thanks for your perspective.",
      parentPostTitle: "Public transport review", 
      expected: "APPROVED"
    }
  ];

  console.log('💬 Testing Comment Moderation:\n');

  for (let i = 0; i < testComments.length; i++) {
    const comment = testComments[i];
    console.log(`Comment Test ${i + 1}: "${comment.content.substring(0, 50)}..."`);
    console.log(`Expected: ${comment.expected}`);
    
    try {
      const result = await contentModerationService.moderateComment(comment);
      
      if (result.success) {
        const { decision, confidence, reasons, severity } = result.result;
        console.log(`✅ Result: ${decision} (Confidence: ${confidence})`);
        if (reasons && reasons.length > 0) {
          console.log(`   Reasons: ${reasons.join(', ')}`);
        }
        if (severity) {
          console.log(`   Severity: ${severity}`);
        }
      } else {
        console.log(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ Exception: ${error.message}`);
    }
    
    console.log(''); // Empty line for spacing
  }

  console.log('🎉 Moderation testing complete!');
  console.log('\nMake sure to add your TOGETHER_API_KEY to the .env file before testing.');
}

// Run the test
testModeration().catch(console.error);
