import { VideoDetails, Comment } from '@/lib/types';

// YouTube API specific interfaces
export interface YouTubeAPIVideoResponse {
  kind: string;
  etag: string;
  items: YouTubeAPIVideoItem[];
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

export interface YouTubeAPIVideoItem {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default?: YouTubeAPIThumbnail;
      medium?: YouTubeAPIThumbnail;
      high?: YouTubeAPIThumbnail;
      standard?: YouTubeAPIThumbnail;
      maxres?: YouTubeAPIThumbnail;
    };
    channelTitle: string;
    categoryId: string;
    liveBroadcastContent: string;
    defaultLanguage?: string;
    localized?: {
      title: string;
      description: string;
    };
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    favoriteCount: string;
    commentCount: string;
  };
  status: {
    uploadStatus: string;
    privacyStatus: string;
    license: string;
    embeddable: boolean;
    publicStatsViewable: boolean;
  };
}

export interface YouTubeAPIThumbnail {
  url: string;
  width: number;
  height: number;
}

export interface YouTubeAPICommentsResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YouTubeAPICommentItem[];
}

export interface YouTubeAPICommentItem {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    videoId: string;
    topLevelComment: {
      kind: string;
      etag: string;
      id: string;
      snippet: {
        videoId: string;
        textDisplay: string;
        textOriginal: string;
        authorDisplayName: string;
        authorProfileImageUrl: string;
        authorChannelUrl: string;
        authorChannelId: {
          value: string;
        };
        canRate: boolean;
        totalReplyCount: number;
        likeCount: number;
        publishedAt: string;
        updatedAt: string;
      };
    };
    canReply: boolean;
    totalReplyCount: number;
    isPublic: boolean;
  };
  replies?: {
    comments: YouTubeAPICommentReply[];
  };
}

export interface YouTubeAPICommentReply {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    videoId: string;
    textDisplay: string;
    textOriginal: string;
    parentId: string;
    authorDisplayName: string;
    authorProfileImageUrl: string;
    authorChannelUrl: string;
    authorChannelId: {
      value: string;
    };
    canRate: boolean;
    likeCount: number;
    publishedAt: string;
    updatedAt: string;
  };
}

// Error types for YouTube API
export class YouTubeAPIError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'YouTubeAPIError';
  }
}

export class YouTubeRateLimitError extends YouTubeAPIError {
  constructor(message: string = 'YouTube API rate limit exceeded') {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
    this.name = 'YouTubeRateLimitError';
  }
}

export class YouTubeAuthError extends YouTubeAPIError {
  constructor(message: string = 'YouTube API authentication failed') {
    super(message, 'AUTH_FAILED', 401);
    this.name = 'YouTubeAuthError';
  }
}

export class YouTubeNotFoundError extends YouTubeAPIError {
  constructor(message: string = 'Video not found or not accessible') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'YouTubeNotFoundError';
  }
}

export class YouTubeCommentsDisabledError extends YouTubeAPIError {
  constructor(message: string = 'Comments are disabled for this video') {
    super(message, 'COMMENTS_DISABLED', 403);
    this.name = 'YouTubeCommentsDisabledError';
  }
}

// YouTube service class
export class YouTubeService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://www.googleapis.com/youtube/v3';
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second base delay

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.YOUTUBE_API_KEY || '';
    
    if (!this.apiKey || this.apiKey.trim() === '') {
      throw new YouTubeAuthError('YouTube API key is required');
    }
  }

  /**
   * Extract video ID from YouTube URL or return the ID if already provided
   */
  private extractVideoId(urlOrId: string): string {
    // If it's already a video ID (11 characters), return it
    if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) {
      return urlOrId;
    }

    // Extract from various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
      const match = urlOrId.match(pattern);
      if (match) {
        return match[1];
      }
    }

    throw new YouTubeNotFoundError('Invalid YouTube URL or video ID format');
  }

  /**
   * Make authenticated request to YouTube API with retry logic
   */
  private async makeRequest<T>(
    endpoint: string,
    params: Record<string, string> = {},
    retryCount = 0
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}/${endpoint}`);
    
    // Add API key and other parameters
    url.searchParams.append('key', this.apiKey);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        await this.handleAPIError(response);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      // Handle rate limiting with exponential backoff
      if (error instanceof YouTubeRateLimitError && retryCount < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest<T>(endpoint, params, retryCount + 1);
      }

      // Re-throw the error if it's already a YouTubeAPIError
      if (error instanceof YouTubeAPIError) {
        throw error;
      }

      // Handle network errors
      if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Network'))) {
        throw new YouTubeAPIError(
          `Network error: ${error.message}`,
          'NETWORK_ERROR',
          0,
          error
        );
      }

      // Handle other unexpected errors
      throw new YouTubeAPIError(
        'Unexpected error occurred while calling YouTube API',
        'UNKNOWN_ERROR',
        0,
        error
      );
    }
  }

  /**
   * Handle API error responses
   */
  private async handleAPIError(response: Response): Promise<never> {
    let errorData: { error?: { message?: string; code?: string | number } };
    
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: { message: 'Unknown API error' } };
    }

    const errorMessage = errorData.error?.message || 'YouTube API request failed';

    switch (response.status) {
      case 400:
        throw new YouTubeAPIError(
          `Bad request: ${errorMessage}`,
          'BAD_REQUEST',
          400,
          errorData
        );
      case 401:
        throw new YouTubeAuthError(
          `Authentication failed: ${errorMessage}`
        );
      case 403:
        if (errorMessage.toLowerCase().includes('quota')) {
          throw new YouTubeRateLimitError(
            `API quota exceeded: ${errorMessage}`
          );
        }
        if (errorMessage.toLowerCase().includes('disabled comments') || 
            errorMessage.toLowerCase().includes('has disabled comments')) {
          throw new YouTubeCommentsDisabledError(
            'Comments are disabled for this video'
          );
        }
        throw new YouTubeAuthError(
          `Access forbidden: ${errorMessage}`
        );
      case 404:
        throw new YouTubeNotFoundError(
          `Resource not found: ${errorMessage}`
        );
      case 429:
        throw new YouTubeRateLimitError(
          `Rate limit exceeded: ${errorMessage}`
        );
      case 500:
      case 502:
      case 503:
      case 504:
        throw new YouTubeAPIError(
          `YouTube API server error: ${errorMessage}`,
          'SERVER_ERROR',
          response.status,
          errorData
        );
      default:
        throw new YouTubeAPIError(
          `YouTube API error: ${errorMessage}`,
          'API_ERROR',
          response.status,
          errorData
        );
    }
  }

  /**
   * Transform YouTube API video response to our VideoDetails interface
   */
  private transformVideoDetails(item: YouTubeAPIVideoItem): VideoDetails {
    const thumbnails = Object.values(item.snippet.thumbnails).map(thumb => ({
      url: thumb.url,
      width: thumb.width,
      height: thumb.height,
    }));

    return {
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnails,
      statistics: {
        viewCount: parseInt(item.statistics.viewCount) || 0,
        likeCount: parseInt(item.statistics.likeCount) || 0,
        commentCount: parseInt(item.statistics.commentCount) || 0,
      },
      publishedAt: item.snippet.publishedAt,
      channelId: item.snippet.channelId,
      channelTitle: item.snippet.channelTitle,
    };
  }

  /**
   * Transform YouTube API comment response to our Comment interface
   */
  private transformComment(item: YouTubeAPICommentItem): Comment {
    const comment = item.snippet.topLevelComment.snippet;
    
    const replies = item.replies?.comments.map(reply => ({
      id: reply.id,
      textDisplay: reply.snippet.textDisplay,
      authorDisplayName: reply.snippet.authorDisplayName,
      authorProfileImageUrl: reply.snippet.authorProfileImageUrl,
      authorChannelId: reply.snippet.authorChannelId?.value,
      publishedAt: reply.snippet.publishedAt,
      likeCount: reply.snippet.likeCount,
    })) || [];

    return {
      id: item.id,
      textDisplay: comment.textDisplay,
      authorDisplayName: comment.authorDisplayName,
      authorProfileImageUrl: comment.authorProfileImageUrl,
      authorChannelId: comment.authorChannelId?.value,
      publishedAt: comment.publishedAt,
      likeCount: comment.likeCount,
      replies: replies.length > 0 ? replies : undefined,
    };
  }

  /**
   * Get video details by video ID or URL
   */
  async getVideoDetails(videoUrlOrId: string): Promise<VideoDetails> {
    try {
      const videoId = this.extractVideoId(videoUrlOrId);
      
      const response = await this.makeRequest<YouTubeAPIVideoResponse>('videos', {
        part: 'snippet,statistics,status',
        id: videoId,
      });

      if (!response.items || response.items.length === 0) {
        throw new YouTubeNotFoundError(
          'Video not found. It may be private, deleted, or the ID is incorrect.'
        );
      }

      const videoItem = response.items[0];
      
      // Check if video is accessible
      if (videoItem.status.privacyStatus === 'private') {
        throw new YouTubeNotFoundError(
          'This video is private and cannot be accessed.'
        );
      }

      return this.transformVideoDetails(videoItem);
    } catch (error) {
      if (error instanceof YouTubeAPIError) {
        throw error;
      }
      
      throw new YouTubeAPIError(
        'Failed to fetch video details',
        'FETCH_ERROR',
        0,
        error
      );
    }
  }

  /**
   * Get comments for a video
   */
  async getComments(
    videoUrlOrId: string,
    maxResults: number = 20,
    pageToken?: string
  ): Promise<{ comments: Comment[]; nextPageToken?: string }> {
    try {
      const videoId = this.extractVideoId(videoUrlOrId);
      
      const params: Record<string, string> = {
        part: 'snippet,replies',
        videoId,
        maxResults: maxResults.toString(),
        order: 'time',
      };

      if (pageToken) {
        params.pageToken = pageToken;
      }

      const response = await this.makeRequest<YouTubeAPICommentsResponse>(
        'commentThreads',
        params
      );

      const comments = response.items.map(item => this.transformComment(item));

      return {
        comments,
        nextPageToken: response.nextPageToken,
      };
    } catch (error) {
      if (error instanceof YouTubeAPIError) {
        throw error;
      }
      
      throw new YouTubeAPIError(
        'Failed to fetch video comments',
        'FETCH_ERROR',
        0,
        error
      );
    }
  }

  /**
   * Validate API key by making a simple request
   */
  async validateAPIKey(): Promise<boolean> {
    try {
      await this.makeRequest('search', {
        part: 'snippet',
        q: 'test',
        maxResults: '1',
        type: 'video',
      });
      return true;
    } catch (error) {
      if (error instanceof YouTubeAuthError) {
        return false;
      }
      // Other errors might not be related to API key validity
      throw error;
    }
  }

  /**
   * Post a comment to a video (requires OAuth token)
   */
  async postComment(
    videoId: string,
    text: string,
    accessToken: string
  ): Promise<Comment> {
    try {
      const requestBody = {
        snippet: {
          videoId: videoId,
          topLevelComment: {
            snippet: {
              textOriginal: text
            }
          }
        }
      };

      const response = await fetch(`${this.baseUrl}/commentThreads?part=snippet`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        await this.handleAPIError(response);
      }

      const data = await response.json();
      return this.transformComment(data);
    } catch (error) {
      if (error instanceof YouTubeAPIError) {
        throw error;
      }
      
      throw new YouTubeAPIError(
        'Failed to post comment',
        'POST_ERROR',
        0,
        error
      );
    }
  }

  /**
   * Reply to a comment (requires OAuth token)
   */
  async replyToComment(
    parentCommentId: string,
    text: string,
    accessToken: string
  ): Promise<Comment> {
    try {
      const requestBody = {
        snippet: {
          parentId: parentCommentId,
          textOriginal: text
        }
      };

      const response = await fetch(`${this.baseUrl}/comments?part=snippet`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        await this.handleAPIError(response);
      }

      const data = await response.json();
      
      // Transform reply to our Comment format
      return {
        id: data.id,
        textDisplay: data.snippet.textDisplay,
        authorDisplayName: data.snippet.authorDisplayName,
        authorProfileImageUrl: data.snippet.authorProfileImageUrl,
        publishedAt: data.snippet.publishedAt,
        likeCount: data.snippet.likeCount,
      };
    } catch (error) {
      if (error instanceof YouTubeAPIError) {
        throw error;
      }
      
      throw new YouTubeAPIError(
        'Failed to post reply',
        'REPLY_ERROR',
        0,
        error
      );
    }
  }

  /**
   * Delete a comment (requires OAuth token and ownership)
   */
  async deleteComment(
    commentId: string,
    accessToken: string
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/comments?id=${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        await this.handleAPIError(response);
      }

      return true;
    } catch (error) {
      if (error instanceof YouTubeAPIError) {
        throw error;
      }
      
      throw new YouTubeAPIError(
        'Failed to delete comment',
        'DELETE_ERROR',
        0,
        error
      );
    }
  }

  /**
   * Get API usage information (requires OAuth for detailed quota info)
   * This is a basic implementation that returns general info
   */
  getAPIInfo(): { baseUrl: string; hasApiKey: boolean } {
    return {
      baseUrl: this.baseUrl,
      hasApiKey: !!this.apiKey,
    };
  }
}

// Export a factory function to create instances
export const createYouTubeService = (apiKey?: string) => new YouTubeService(apiKey);

// Export a default instance (will be created when first accessed)
let _defaultInstance: YouTubeService | null = null;

export const youtubeService = {
  getInstance(): YouTubeService {
    if (!_defaultInstance) {
      _defaultInstance = new YouTubeService();
    }
    return _defaultInstance;
  }
};