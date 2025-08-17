# Enhanced Notes Search API Documentation

## Overview

The enhanced notes search system provides powerful search and filtering capabilities for user notes, including real-time search suggestions, tag-based filtering, and content highlighting.

## API Endpoints

### 1. Enhanced Search - `/api/notes/search`

**Method:** GET

**Description:** Performs advanced search across user notes with multiple filtering options and enhanced features.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | string | No | - | Text to search for in note content and tags |
| `tags` | string[] | No | - | Comma-separated list of tags to filter by |
| `videoId` | string | No | - | Filter notes for specific video |
| `page` | number | No | 1 | Page number for pagination |
| `limit` | number | No | 20 | Number of results per page (max 100) |
| `orderBy` | enum | No | 'relevance' | Sort order: 'createdAt', 'updatedAt', 'content', 'relevance' |
| `orderDirection` | enum | No | 'desc' | Sort direction: 'asc', 'desc' |
| `includeHighlights` | boolean | No | false | Include highlighted search terms in results |

**Example Requests:**

```bash
# Basic text search
GET /api/notes/search?query=react

# Tag-based filtering
GET /api/notes/search?tags=javascript,tutorial

# Combined search with highlights
GET /api/notes/search?query=hooks&tags=react&includeHighlights=true

# Video-specific search
GET /api/notes/search?videoId=abc123&query=component

# Paginated results
GET /api/notes/search?query=testing&page=2&limit=10
```

**Response Format:**

```json
{
  "success": true,
  "data": {
    "notes": [
      {
        "id": "note-123",
        "videoId": "video-456",
        "content": "This is about React hooks",
        "tags": ["react", "hooks", "tutorial"],
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z",
        "userId": "user-789",
        "highlightedContent": "This is about <mark>React</mark> <mark>hooks</mark>"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalCount": 42,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    },
    "searchMeta": {
      "query": "react hooks",
      "tags": ["react"],
      "videoId": null,
      "orderBy": "relevance",
      "includeHighlights": true,
      "searchTime": 1642723200000
    }
  }
}
```

### 2. Search Suggestions - `/api/notes/suggestions`

**Method:** GET

**Description:** Provides intelligent search suggestions based on user's existing notes content and tags.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | string | Yes | - | Partial search term (minimum 2 characters) |
| `limit` | number | No | 10 | Maximum number of suggestions (max 20) |
| `type` | enum | No | 'both' | Suggestion type: 'content', 'tags', 'both' |

**Example Requests:**

```bash
# Get all suggestions
GET /api/notes/suggestions?query=react

# Get only tag suggestions
GET /api/notes/suggestions?query=dev&type=tags

# Limit suggestions
GET /api/notes/suggestions?query=test&limit=5
```

**Response Format:**

```json
{
  "success": true,
  "data": [
    {
      "text": "react-hooks",
      "type": "content",
      "frequency": 5,
      "context": "...about react-hooks and their usage in..."
    },
    {
      "text": "react",
      "type": "tag",
      "frequency": 12
    }
  ]
}
```

### 3. Get User Tags - `/api/notes/tags`

**Method:** GET

**Description:** Retrieves all unique tags used by the authenticated user, sorted alphabetically.

**Response Format:**

```json
{
  "success": true,
  "data": [
    "javascript",
    "react",
    "tutorial",
    "typescript"
  ]
}
```

## Search Features

### 1. Text Search

- **Case-insensitive:** Search is performed without case sensitivity
- **Content and Tags:** Searches both note content and tag names
- **Partial Matching:** Supports partial word matching
- **Multiple Terms:** Supports searching for multiple terms (OR logic)

### 2. Tag Filtering

- **Exact Matching:** Tags are matched exactly within the JSON structure
- **Multiple Tags:** Support for filtering by multiple tags (OR logic)
- **Case-insensitive:** Tag matching is case-insensitive

### 3. Relevance Scoring

When `orderBy=relevance` is used with a search query:
- Notes with query terms in multiple places rank higher
- More recent notes get slight preference
- Tag matches are weighted equally with content matches

### 4. Search Highlighting

When `includeHighlights=true`:
- Search terms are wrapped in `<mark>` tags
- Only applies to content, not tags
- Preserves original formatting

### 5. Search Suggestions

- **Content Suggestions:** Based on words found in note content
- **Tag Suggestions:** Based on existing user tags
- **Frequency Ranking:** Suggestions sorted by usage frequency
- **Context Preview:** Content suggestions include surrounding text

## Database Indexing

The following indexes are created for optimal search performance:

```sql
-- Individual indexes
CREATE INDEX "Note_content_idx" ON "notes"("content");
CREATE INDEX "Note_tags_idx" ON "notes"("tags");

-- Composite indexes for common query patterns
CREATE INDEX "Note_userId_videoId_idx" ON "notes"("userId", "videoId");
CREATE INDEX "Note_userId_createdAt_idx" ON "notes"("userId", "createdAt");
```

## Performance Considerations

### Search Optimization

1. **Indexed Fields:** All searchable fields are properly indexed
2. **Pagination:** Always use pagination for large result sets
3. **Query Limits:** API enforces reasonable limits on result sizes
4. **Debounced Requests:** Frontend should debounce search requests

### Rate Limiting

- **Search Endpoint:** 100 requests per minute per user
- **Suggestions Endpoint:** Included in general rate limit
- **Tags Endpoint:** Cached and rate-limited

### Caching Strategy

1. **Tags Cache:** User tags are cached for 5 minutes
2. **Search Results:** No caching (real-time results)
3. **Suggestions:** Client-side caching recommended

## Error Handling

### Common Error Responses

```json
{
  "success": false,
  "error": "Authentication required",
  "message": "Please sign in to access this resource"
}
```

```json
{
  "success": false,
  "error": "Invalid query parameters",
  "message": "Query must be at least 2 characters long"
}
```

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later."
}
```

### Error Codes

- `401` - Authentication required
- `404` - User not found
- `400` - Invalid parameters
- `429` - Rate limit exceeded
- `500` - Internal server error

## Usage Examples

### Frontend Integration

```typescript
// Search with debouncing
const [searchQuery, setSearchQuery] = useState('');
const [searchResults, setSearchResults] = useState(null);

const debouncedSearch = useCallback(
  debounce(async (query: string) => {
    if (query.length < 2) return;
    
    const params = new URLSearchParams({
      query,
      includeHighlights: 'true',
      limit: '20'
    });
    
    const response = await fetch(`/api/notes/search?${params}`);
    const result = await response.json();
    
    if (result.success) {
      setSearchResults(result.data);
    }
  }, 300),
  []
);

useEffect(() => {
  debouncedSearch(searchQuery);
}, [searchQuery, debouncedSearch]);
```

### Search Suggestions

```typescript
// Get suggestions as user types
const getSuggestions = async (query: string) => {
  if (query.length < 2) return [];
  
  const params = new URLSearchParams({
    query,
    limit: '8',
    type: 'both'
  });
  
  const response = await fetch(`/api/notes/suggestions?${params}`);
  const result = await response.json();
  
  return result.success ? result.data : [];
};
```

## Security Considerations

1. **User Isolation:** All searches are scoped to the authenticated user
2. **Input Sanitization:** All search inputs are sanitized
3. **SQL Injection Prevention:** Using Prisma ORM with parameterized queries
4. **Rate Limiting:** Prevents abuse and ensures fair usage
5. **Authentication Required:** All endpoints require valid authentication

## Future Enhancements

1. **Full-Text Search:** Upgrade to PostgreSQL with full-text search capabilities
2. **Fuzzy Matching:** Implement fuzzy string matching for typo tolerance
3. **Search Analytics:** Track search patterns for optimization
4. **Advanced Filters:** Date ranges, content length, etc.
5. **Saved Searches:** Allow users to save and reuse complex searches