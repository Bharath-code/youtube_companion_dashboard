# YouTube API Integration Service

This directory contains the YouTube API integration service for the YouTube Companion Dashboard.

## Overview

The YouTube service provides a comprehensive interface to interact with the YouTube Data API v3, including:

- Video details fetching
- Comments retrieval
- Error handling with retry logic
- Rate limiting protection
- TypeScript interfaces for all API responses

## Files

### `youtube.ts`
Main service class that handles all YouTube API interactions.

**Key Features:**
- **Authentication**: Handles API key authentication
- **Video Details**: Fetch comprehensive video information
- **Comments**: Retrieve video comments with pagination
- **Error Handling**: Comprehensive error handling for different API error types
- **Rate Limiting**: Automatic retry with exponential backoff
- **URL Parsing**: Extract video IDs from various YouTube URL formats

**Usage:**
```typescript
import { youtubeService } from '@/lib/services/youtube';

// Get video details
const video = await youtubeService.getInstance().getVideoDetails('dQw4w9WgXcQ');

// Get comments
const comments = await youtubeService.getInstance().getComments('dQw4w9WgXcQ', 20);
```

## API Endpoints

The service is exposed through Next.js API routes:

### `GET /api/youtube/video`
Fetch video details by ID or URL.

**Parameters:**
- `id` (required): YouTube video ID or URL

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "dQw4w9WgXcQ",
    "title": "Video Title",
    "description": "Video description...",
    "thumbnails": [...],
    "statistics": {
      "viewCount": 1000000,
      "likeCount": 50000,
      "commentCount": 1000
    },
    "publishedAt": "2023-01-01T00:00:00Z",
    "channelId": "channel-id",
    "channelTitle": "Channel Name"
  }
}
```

### `GET /api/youtube/comments`
Fetch video comments with pagination.

**Parameters:**
- `id` (required): YouTube video ID or URL
- `maxResults` (optional): Number of comments to fetch (default: 20)
- `pageToken` (optional): Token for pagination

**Response:**
```json
{
  "success": true,
  "data": {
    "comments": [...],
    "nextPageToken": "token-for-next-page"
  }
}
```

## Error Handling

The service includes comprehensive error handling for:

- **Authentication Errors** (`YouTubeAuthError`): Invalid API key or permissions
- **Rate Limiting** (`YouTubeRateLimitError`): API quota exceeded
- **Not Found** (`YouTubeNotFoundError`): Video not found or private
- **Network Errors**: Connection issues
- **General API Errors**: Other YouTube API errors

All errors include appropriate HTTP status codes and descriptive messages.

## Configuration

The service requires a YouTube Data API v3 key set in environment variables:

```env
YOUTUBE_API_KEY=your_api_key_here
```

## Testing

Unit tests are available in `__tests__/youtube.test.ts` covering:

- Video ID extraction from URLs
- Video details fetching
- Error handling scenarios
- API key validation

Run tests with:
```bash
npm test -- --testPathPatterns=youtube.test.ts
```

## Rate Limiting

The service implements automatic retry logic with exponential backoff for rate limiting:

- Maximum 3 retries
- Base delay of 1 second
- Exponential backoff (1s, 2s, 4s)
- Graceful degradation on quota exceeded

## Security

- API keys are never exposed to the client
- All requests go through server-side API routes
- Input validation for video IDs and URLs
- Proper error sanitization to prevent information leakage

## Helper Utilities

Additional utilities are available in `@/lib/utils/youtube-helpers.ts`:

- Client-side API calling functions
- Video ID extraction and validation
- Formatting utilities (view counts, dates, etc.)
- Thumbnail selection helpers

## Requirements Satisfied

This implementation satisfies the following requirements:

- **2.1**: Fetch and display video details via YouTube API
- **2.3**: Handle API errors and rate limits appropriately  
- **9.4**: Secure API key handling and HTTPS communications