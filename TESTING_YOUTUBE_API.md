# Testing YouTube API Integration

This document provides comprehensive instructions for testing the YouTube API integration feature.

## Prerequisites

1. **YouTube API Key**: Ensure you have a valid YouTube Data API v3 key in your `.env.local` file:
   ```env
   YOUTUBE_API_KEY=your_api_key_here
   ```

2. **Dependencies**: Make sure all dependencies are installed:
   ```bash
   npm install
   ```

## Testing Methods

### 1. Unit Tests

Run the automated unit tests to verify the service logic:

```bash
# Run all YouTube-related tests
npm test -- --testPathPatterns=youtube.test.ts

# Run tests with coverage
npm run test:coverage -- --testPathPatterns=youtube.test.ts

# Run tests in watch mode during development
npm run test:watch -- --testPathPatterns=youtube.test.ts
```

**What the tests cover:**
- Constructor validation (API key required)
- Video ID extraction from various URL formats
- Video details fetching
- Comments retrieval
- Error handling (401, 429, network errors)
- API key validation

### 2. API Endpoint Testing

#### Option A: Using the Test Script

1. Start the development server:
   ```bash
   npm run dev
   ```

2. In another terminal, run the test script:
   ```bash
   node test-youtube-api.js
   ```

#### Option B: Manual API Testing with curl

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Test video details endpoint:
   ```bash
   # Test with video ID
   curl "http://localhost:3000/api/youtube/video?id=dQw4w9WgXcQ"
   
   # Test with YouTube URL
   curl "http://localhost:3000/api/youtube/video?id=https://www.youtube.com/watch?v=dQw4w9WgXcQ"
   
   # Test with short URL
   curl "http://localhost:3000/api/youtube/video?id=https://youtu.be/dQw4w9WgXcQ"
   ```

3. Test comments endpoint:
   ```bash
   # Get 5 comments
   curl "http://localhost:3000/api/youtube/comments?id=dQw4w9WgXcQ&maxResults=5"
   
   # Test pagination (use nextPageToken from previous response)
   curl "http://localhost:3000/api/youtube/comments?id=dQw4w9WgXcQ&maxResults=5&pageToken=YOUR_PAGE_TOKEN"
   ```

4. Test error handling:
   ```bash
   # Test with invalid video ID
   curl "http://localhost:3000/api/youtube/video?id=invalid-id"
   
   # Test with missing ID parameter
   curl "http://localhost:3000/api/youtube/video"
   ```

### 3. Browser Testing

#### Option A: Using the Test Page

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the test page:
   ```
   http://localhost:3000/test-youtube
   ```

3. Test different scenarios:
   - Enter a video ID (e.g., `dQw4w9WgXcQ`)
   - Enter a full YouTube URL (e.g., `https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
   - Enter a short URL (e.g., `https://youtu.be/dQw4w9WgXcQ`)
   - Test with invalid IDs to see error handling
   - Click "Test Video Details" to fetch video information
   - Click "Test Comments" to fetch video comments

#### Option B: Browser Developer Tools

1. Open your browser's developer tools (F12)
2. Navigate to the Console tab
3. Test the helper functions directly:

```javascript
// Test video details
fetch('/api/youtube/video?id=dQw4w9WgXcQ')
  .then(r => r.json())
  .then(console.log);

// Test comments
fetch('/api/youtube/comments?id=dQw4w9WgXcQ&maxResults=3')
  .then(r => r.json())
  .then(console.log);
```

## Test Cases

### Valid Test Cases

1. **Popular Public Video**: `dQw4w9WgXcQ` (Rick Astley - Never Gonna Give You Up)
2. **Recent Video**: Find a recent popular video ID
3. **Different URL Formats**:
   - Direct ID: `dQw4w9WgXcQ`
   - Standard URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
   - Short URL: `https://youtu.be/dQw4w9WgXcQ`
   - Embed URL: `https://www.youtube.com/embed/dQw4w9WgXcQ`

### Error Test Cases

1. **Invalid Video ID**: `invalid-id-123`
2. **Non-existent Video**: `aaaaaaaaaaa`
3. **Private Video**: (Find a private video ID if available)
4. **Missing Parameters**: Test endpoints without required parameters
5. **Malformed URLs**: `not-a-youtube-url`

### Expected Results

#### Successful Video Details Response:
```json
{
  "success": true,
  "data": {
    "id": "dQw4w9WgXcQ",
    "title": "Rick Astley - Never Gonna Give You Up (Official Video)",
    "description": "The official video for...",
    "thumbnails": [...],
    "statistics": {
      "viewCount": 1684928098,
      "likeCount": 18505401,
      "commentCount": 2402957
    },
    "publishedAt": "2009-10-25T06:57:33Z",
    "channelId": "UCuAXFkgsw1L7xaCfnd5JJOw",
    "channelTitle": "Rick Astley"
  }
}
```

#### Successful Comments Response:
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": "comment-id",
        "textDisplay": "Comment text...",
        "authorDisplayName": "Author Name",
        "authorProfileImageUrl": "https://...",
        "publishedAt": "2023-01-01T00:00:00Z",
        "likeCount": 100,
        "replies": [...]
      }
    ],
    "nextPageToken": "token-for-next-page"
  }
}
```

#### Error Response:
```json
{
  "success": false,
  "error": "Video not found. It may be private, deleted, or the ID is incorrect."
}
```

## Performance Testing

### Rate Limiting

Test the rate limiting behavior:

1. Make multiple rapid requests to the same endpoint
2. Verify that the service handles rate limits gracefully
3. Check that retry logic works with exponential backoff

### Large Comments

Test with videos that have many comments:

1. Use a viral video with thousands of comments
2. Test pagination with different `maxResults` values
3. Verify performance with large comment threads

## Troubleshooting

### Common Issues

1. **"YouTube API key is required"**
   - Check that `YOUTUBE_API_KEY` is set in `.env.local`
   - Verify the API key is valid and has YouTube Data API v3 enabled

2. **"Authentication failed"**
   - Verify your API key is correct
   - Check that the YouTube Data API v3 is enabled in Google Cloud Console
   - Ensure your API key has the correct restrictions (if any)

3. **"Rate limit exceeded"**
   - This is expected behavior for testing
   - Wait a few minutes and try again
   - Consider using different video IDs for testing

4. **Network errors**
   - Check your internet connection
   - Verify the development server is running
   - Check for firewall or proxy issues

### Debug Mode

Enable debug logging by adding console.log statements in the service:

```typescript
// In youtube.ts, add logging to the makeRequest method
console.log('Making request to:', url.toString());
console.log('Response status:', response.status);
```

## Security Testing

1. **API Key Protection**: Verify that API keys are never exposed to the client
2. **Input Validation**: Test with malicious inputs and SQL injection attempts
3. **Error Information**: Ensure error messages don't leak sensitive information
4. **HTTPS**: Verify all API calls use HTTPS in production

## Automated Testing in CI/CD

For continuous integration, you can run the unit tests:

```bash
# In your CI pipeline
npm ci
npm run test -- --testPathPatterns=youtube.test.ts --coverage --watchAll=false
```

Note: API integration tests should use mocked responses in CI to avoid rate limiting and API key exposure.

## Next Steps

After verifying the YouTube API integration works correctly:

1. Implement the video details display component (Task 6)
2. Add video management features (Task 7)
3. Integrate with the dashboard UI (Task 8)
4. Add error handling and loading states to the UI
5. Implement caching for better performance