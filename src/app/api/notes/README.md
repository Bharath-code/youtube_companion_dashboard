# Notes API Documentation

## Overview

The Notes API provides comprehensive CRUD operations for managing user notes associated with YouTube videos. All endpoints require authentication and implement proper authorization, input validation, error handling, and event logging.

## Authentication

All endpoints require a valid session token obtained through NextAuth.js Google OAuth authentication.

## Rate Limiting

- **Limit**: 100 requests per 15 minutes per user
- **Headers**: 
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Timestamp when the rate limit resets

## Endpoints

### GET /api/notes

Fetch notes with optional search and pagination.

**Query Parameters:**
- `query` (optional): Search term to filter notes by content
- `tags` (optional): Comma-separated list of tags to filter by
- `videoId` (optional): Filter notes by specific video ID
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of results per page (default: 20, max: 100)
- `orderBy` (optional): Sort field - `createdAt`, `updatedAt`, or `content` (default: `createdAt`)
- `orderDirection` (optional): Sort direction - `asc` or `desc` (default: `desc`)

**Response:**
```json
{
  "success": true,
  "data": {
    "notes": [
      {
        "id": "note_123",
        "videoId": "dQw4w9WgXcQ",
        "content": "Great video about...",
        "tags": ["tutorial", "helpful"],
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z",
        "userId": "user_456"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalCount": 1,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

**Event Logging:** Logs `SEARCH_PERFORMED` event when search parameters are provided.

### POST /api/notes

Create a new note.

**Request Body:**
```json
{
  "videoId": "dQw4w9WgXcQ",
  "content": "This is my note about the video",
  "tags": ["tutorial", "helpful"]
}
```

**Validation:**
- `videoId`: Required, non-empty string
- `content`: Required, 1-10000 characters
- `tags`: Optional array of strings

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "note_123",
    "videoId": "dQw4w9WgXcQ",
    "content": "This is my note about the video",
    "tags": ["tutorial", "helpful"],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "userId": "user_456"
  },
  "message": "Note created successfully"
}
```

**Event Logging:** Logs `NOTE_CREATED` event.

### GET /api/notes/[noteId]

Get a specific note by ID.

**Parameters:**
- `noteId`: The unique identifier of the note

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "note_123",
    "videoId": "dQw4w9WgXcQ",
    "content": "This is my note about the video",
    "tags": ["tutorial", "helpful"],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "userId": "user_456"
  }
}
```

### PUT /api/notes/[noteId]

Update a specific note.

**Parameters:**
- `noteId`: The unique identifier of the note

**Request Body:**
```json
{
  "content": "Updated note content",
  "tags": ["updated", "tags"],
  "videoId": "new_video_id"
}
```

**Validation:**
- All fields are optional
- `content`: If provided, must be 1-10000 characters
- `tags`: If provided, must be array of strings
- `videoId`: If provided, must be non-empty string

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "note_123",
    "videoId": "new_video_id",
    "content": "Updated note content",
    "tags": ["updated", "tags"],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T11:00:00Z",
    "userId": "user_456"
  },
  "message": "Note updated successfully"
}
```

**Event Logging:** Logs `NOTE_UPDATED` event with change details.

### DELETE /api/notes/[noteId]

Delete a specific note.

**Parameters:**
- `noteId`: The unique identifier of the note

**Response:**
```json
{
  "success": true,
  "data": {
    "deleted": true
  },
  "message": "Note deleted successfully"
}
```

**Event Logging:** Logs `NOTE_DELETED` event.

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid input data",
  "message": "Content is required"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Authentication required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Note not found"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later."
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

## Security Features

1. **Authentication**: All endpoints require valid session
2. **Authorization**: Users can only access their own notes
3. **Input Validation**: Comprehensive validation using Zod schemas
4. **Input Sanitization**: Content and tags are trimmed and sanitized
5. **Rate Limiting**: Prevents abuse with configurable limits
6. **Event Logging**: All operations are logged for audit purposes
7. **Error Handling**: Graceful error handling with user-friendly messages

## Database Schema

```sql
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  videoId TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT, -- JSON string for SQLite compatibility
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  userId TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notes_videoId ON notes(videoId);
CREATE INDEX idx_notes_userId ON notes(userId);
```

## Event Logging

All note operations generate event logs with the following structure:

```json
{
  "eventType": "NOTE_CREATED|NOTE_UPDATED|NOTE_DELETED|SEARCH_PERFORMED",
  "entityType": "NOTE",
  "entityId": "note_id_or_search",
  "metadata": {
    "videoId": "video_id",
    "changes": {...},
    "searchParams": {...}
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "userId": "user_456",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

## Testing

The API includes comprehensive unit tests covering:
- CRUD operations
- Input validation
- Error handling
- Authentication and authorization
- Event logging

Run tests with:
```bash
npm test -- --testPathPatterns=notes.test.ts
```