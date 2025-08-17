#!/usr/bin/env node

/**
 * Test script for YouTube API integration
 * Run this after starting the development server with `npm run dev`
 */

const testVideoId = 'dQw4w9WgXcQ'; // Rick Roll - always available for testing
const baseUrl = 'http://localhost:3000';

async function testVideoEndpoint() {
  console.log('🎥 Testing Video Details Endpoint...');
  
  try {
    const response = await fetch(`${baseUrl}/api/youtube/video?id=${testVideoId}`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Video details fetched successfully!');
      console.log(`   Title: ${data.data.title}`);
      console.log(`   Channel: ${data.data.channelTitle}`);
      console.log(`   Views: ${data.data.statistics.viewCount.toLocaleString()}`);
      console.log(`   Likes: ${data.data.statistics.likeCount.toLocaleString()}`);
    } else {
      console.log('❌ Failed to fetch video details:', data.error);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

async function testCommentsEndpoint() {
  console.log('\n💬 Testing Comments Endpoint...');
  
  try {
    const response = await fetch(`${baseUrl}/api/youtube/comments?id=${testVideoId}&maxResults=5`);
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Comments fetched successfully! Found ${data.data.comments.length} comments`);
      
      if (data.data.comments.length > 0) {
        const firstComment = data.data.comments[0];
        console.log(`   First comment by: ${firstComment.authorDisplayName}`);
        console.log(`   Comment: ${firstComment.textDisplay.substring(0, 100)}...`);
        console.log(`   Likes: ${firstComment.likeCount}`);
      }
      
      if (data.data.nextPageToken) {
        console.log(`   Next page token available: ${data.data.nextPageToken.substring(0, 20)}...`);
      }
    } else {
      console.log('❌ Failed to fetch comments:', data.error);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

async function testErrorHandling() {
  console.log('\n🚫 Testing Error Handling...');
  
  try {
    // Test with invalid video ID
    const response = await fetch(`${baseUrl}/api/youtube/video?id=invalid-id`);
    const data = await response.json();
    
    if (!data.success) {
      console.log('✅ Error handling works correctly for invalid video ID');
      console.log(`   Error: ${data.error}`);
    } else {
      console.log('❌ Expected error for invalid video ID, but got success');
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

async function testUrlFormats() {
  console.log('\n🔗 Testing Different URL Formats...');
  
  const urlFormats = [
    testVideoId, // Direct ID
    `https://www.youtube.com/watch?v=${testVideoId}`, // Standard URL
    `https://youtu.be/${testVideoId}`, // Short URL
    `https://www.youtube.com/embed/${testVideoId}`, // Embed URL
  ];
  
  for (const url of urlFormats) {
    try {
      const response = await fetch(`${baseUrl}/api/youtube/video?id=${encodeURIComponent(url)}`);
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ ${url.length > 20 ? url.substring(0, 40) + '...' : url} - Success`);
      } else {
        console.log(`❌ ${url.length > 20 ? url.substring(0, 40) + '...' : url} - Failed: ${data.error}`);
      }
    } catch (error) {
      console.log(`❌ ${url.length > 20 ? url.substring(0, 40) + '...' : url} - Network error: ${error.message}`);
    }
  }
}

async function runAllTests() {
  console.log('🧪 YouTube API Integration Tests');
  console.log('================================');
  console.log(`Testing with video: ${testVideoId}`);
  console.log(`Server: ${baseUrl}`);
  console.log('');
  
  await testVideoEndpoint();
  await testCommentsEndpoint();
  await testErrorHandling();
  await testUrlFormats();
  
  console.log('\n🏁 All tests completed!');
  console.log('\nTo run these tests:');
  console.log('1. Start the dev server: npm run dev');
  console.log('2. Run this script: node test-youtube-api.js');
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ This script requires Node.js 18+ or you can install node-fetch');
  console.log('   Alternative: Test the endpoints manually using curl or a REST client');
  process.exit(1);
}

runAllTests().catch(console.error);