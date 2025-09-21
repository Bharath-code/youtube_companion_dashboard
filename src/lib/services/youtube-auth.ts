import { VideoDetails } from '@/lib/types';
import { YouTubeService, YouTubeAPIError, YouTubeAuthError, YouTubeNotFoundError } from './youtube';

// Extended YouTube service that works with OAuth tokens
export class AuthenticatedYouTubeService extends YouTubeService {
  private accessToken: string;

  constructor(accessToken: string, apiKey?: string) {
    super(apiKey);
    this.accessToken = accessToken;
  }

  /**
   * Make authenticated request to YouTube API using OAuth token
   */
  private async makeAuthenticatedRequest<T>(
    endpoint: string,
    params: Record<string, string> = {},
    retryCount = 0
  ): Promise<T> {
    const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);

    // Add parameters
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        await this.handleAuthAPIError(response);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      // Handle rate limiting with exponential backoff
      if (error instanceof Error && error.message.includes('rate limit') && retryCount < 3) {
        const delay = 1000 * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeAuthenticatedRequest<T>(endpoint, params, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Handle API error responses for authenticated requests
   */
  private async handleAuthAPIError(response: Response): Promise<never> {
    let errorData: {
      error?: {
        message?: string;
        code?: string | number;
        errors?: Array<{
          domain: string;
          reason: string;
          message: string;
        }>;
      }
    };

    try {
      errorData = await response.json();
    } catch {
      errorData = { error: { message: 'Unknown API error' } };
    }

    // Get more detailed error message
    let errorMessage = errorData.error?.message || 'YouTube API request failed';

    // Add specific error details if available
    if (errorData.error?.errors && errorData.error.errors.length > 0) {
      const specificErrors = errorData.error.errors.map(err => err.message).join(', ');
      errorMessage = `${errorMessage}: ${specificErrors}`;
    }

    switch (response.status) {
      case 401:
        throw new YouTubeAuthError(
          `Authentication failed: ${errorMessage}. Please sign in again.`
        );
      case 403:
        if (errorMessage.toLowerCase().includes('quota')) {
          throw new YouTubeAPIError(
            `API quota exceeded: ${errorMessage}`,
            'QUOTA_EXCEEDED',
            403
          );
        }
        throw new YouTubeAuthError(
          `Access forbidden: ${errorMessage}. You may not have permission to access this video.`
        );
      case 404:
        throw new YouTubeNotFoundError(
          `Video not found: ${errorMessage}. The video may be private, deleted, or you may not have access to it.`
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
   * Get the authenticated user's YouTube channel information
   */
  async getUserChannel(): Promise<{
    id: string;
    title: string;
    description: string;
    thumbnails: Record<string, unknown>;
    uploadsPlaylistId?: string;
  }> {
    try {
      const response = await this.makeAuthenticatedRequest<{
        items: Array<{
          id: string;
          snippet: {
            title: string;
            description: string;
            thumbnails: Record<string, unknown>;
          };
          contentDetails: {
            relatedPlaylists: {
              uploads: string;
            };
          };
        }>;
      }>('channels', {
        part: 'snippet,contentDetails',
        mine: 'true',
      });

      const data = response;

      if (!data.items || data.items.length === 0) {
        throw new YouTubeNotFoundError(
          'No YouTube channel found for this account. Please make sure you have a YouTube channel.'
        );
      }

      const channel = data.items[0];
      return {
        id: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        thumbnails: channel.snippet.thumbnails,
        uploadsPlaylistId: channel.contentDetails.relatedPlaylists.uploads,
      };
    } catch (error) {
      if (error instanceof YouTubeAPIError) {
        throw error;
      }

      throw new YouTubeAPIError(
        'Failed to fetch user channel information',
        'FETCH_ERROR',
        0,
        error
      );
    }
  }

  /**
   * Get user's uploaded videos (including unlisted)
   */
  async getUserVideos(maxResults: number = 50, pageToken?: string): Promise<{
    videos: (VideoDetails & { privacyStatus?: string })[];
    nextPageToken?: string;
    totalResults: number;
  }> {
    try {
      // First get the user's channel to get the uploads playlist ID
      const userChannel = await this.getUserChannel();

      if (!userChannel.uploadsPlaylistId) {
        throw new YouTubeAPIError(
          'No uploads playlist found for this channel',
          'NO_UPLOADS_PLAYLIST',
          404
        );
      }

      // Get playlist items (videos) from the uploads playlist
      const playlistParams: Record<string, string> = {
        part: 'snippet',
        playlistId: userChannel.uploadsPlaylistId,
        maxResults: maxResults.toString(),
      };

      if (pageToken) {
        playlistParams.pageToken = pageToken;
      }

      const playlistResponse = await this.makeAuthenticatedRequest<{
        items: Array<{
          snippet: {
            resourceId: {
              videoId: string;
            };
          };
        }>;
        nextPageToken?: string;
        pageInfo: {
          totalResults: number;
        };
      }>('playlistItems', playlistParams);

      // Extract video IDs
      const videoIds = playlistResponse.items.map(item => item.snippet.resourceId.videoId);

      if (videoIds.length === 0) {
        return {
          videos: [],
          nextPageToken: playlistResponse.nextPageToken,
          totalResults: playlistResponse.pageInfo.totalResults,
        };
      }

      // Get detailed video information for all videos
      const videosResponse = await this.makeAuthenticatedRequest<{
        items: Array<{
          id: string;
          snippet: {
            title: string;
            description: string;
            publishedAt: string;
            channelId: string;
            channelTitle: string;
            thumbnails: Record<string, { url: string; width: number; height: number }>;
          };
          statistics: {
            viewCount: string;
            likeCount: string;
            commentCount: string;
          };
          status: {
            privacyStatus: string;
          };
        }>;
      }>('videos', {
        part: 'snippet,statistics,status',
        id: videoIds.join(','),
      });

      // Transform to our VideoDetails format with privacy status
      const videos = videosResponse.items.map(item => ({
        ...this.transformAuthVideoDetails(item),
        privacyStatus: item.status.privacyStatus,
      }));

      return {
        videos,
        nextPageToken: playlistResponse.nextPageToken,
        totalResults: playlistResponse.pageInfo.totalResults,
      };
    } catch (error) {
      if (error instanceof YouTubeAPIError) {
        throw error;
      }

      throw new YouTubeAPIError(
        'Failed to fetch user videos',
        'FETCH_ERROR',
        0,
        error
      );
    }
  }

  /**
   * Get video details with ownership validation
   */
  async getVideoDetailsWithOwnership(videoUrlOrId: string): Promise<{
    video: VideoDetails;
    isOwner: boolean;
    isUnlisted: boolean;
  }> {
    try {
      const videoId = this.extractVideoIdFromUrl(videoUrlOrId);

      // Get video details using authenticated request to access unlisted videos
      const response = await this.makeAuthenticatedRequest<{
        items: Array<{
          id: string;
          snippet: {
            title: string;
            description: string;
            publishedAt: string;
            channelId: string;
            channelTitle: string;
            thumbnails: Record<string, { url: string; width: number; height: number }>;
          };
          statistics: {
            viewCount: string;
            likeCount: string;
            commentCount: string;
          };
          status: {
            privacyStatus: string;
          };
        }>;
      }>('videos', {
        part: 'snippet,statistics,status',
        id: videoId,
      });

      const data = response;

      if (!data.items || data.items.length === 0) {
        throw new YouTubeNotFoundError(
          'Video not found. It may be private, deleted, or you may not have access to it.'
        );
      }

      const videoItem = data.items[0];

      // Transform to our VideoDetails format
      const video = this.transformAuthVideoDetails(videoItem);

      // Get user's channel to check ownership
      const userChannel = await this.getUserChannel();
      const isOwner = video.channelId === userChannel.id;

      // Check if video is unlisted
      const isUnlisted = videoItem.status.privacyStatus === 'unlisted';

      // Only allow access if user owns the video
      if (!isOwner) {
        throw new YouTubeAuthError(
          'Access denied. You can only access videos from your own YouTube channel.'
        );
      }

      return {
        video,
        isOwner,
        isUnlisted,
      };
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
   * Update video metadata (title, description)
   */
  /*async updateVideoMetadata(
    videoId: string,
    updates: { title?: string; description?: string }
  ): Promise<VideoDetails> {
    try {
      // First verify ownership and get current video details
      const { isOwner } = await this.getVideoDetailsWithOwnership(videoId);

      if (!isOwner) {
        throw new YouTubeAuthError(
          'You can only edit videos from your own YouTube channel.'
        );
      }

      // Get the complete current snippet data from YouTube API
      const currentVideoResponse = await this.makeAuthenticatedRequest<{
        items: Array<{
          id: string;
          snippet: {
            title: string;
            description: string;
            channelId: string;
            channelTitle: string;
            categoryId: string;
            defaultLanguage?: string;
            defaultAudioLanguage?: string;
            liveBroadcastContent: string;
            publishedAt: string;
            thumbnails: Record<string, unknown>;
            tags?: string[];
          };
        }>;
      }>('videos', {
        part: 'snippet',
        id: videoId,
      });

      if (!currentVideoResponse.items || currentVideoResponse.items.length === 0) {
        throw new YouTubeNotFoundError('Video not found for update');
      }

      const currentSnippet = currentVideoResponse.items[0].snippet;

      // Create updated snippet with only the fields we want to change
      const updatedSnippet = {
        ...currentSnippet,
        title: updates.title !== undefined ? updates.title : currentSnippet.title,
        description: updates.description !== undefined ? updates.description : currentSnippet.description,
      };

      // Validate required fields are present
      if (!updatedSnippet.title || !updatedSnippet.categoryId) {
        throw new YouTubeAPIError(
          'Missing required fields: title and categoryId are required',
          'MISSING_REQUIRED_FIELDS',
          400
        );
      }

      // Make the update request using PATCH method with proper structure
      const requestPayload = {
        id: videoId,
        snippet: updatedSnippet,
      };

      const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet`, {
        method: 'PUT', // YouTube API uses PUT for video updates
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        // Log the error details for debugging
        const errorText = await response.text();
        console.error('YouTube API Update Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          requestPayload: requestPayload,
          url: `https://www.googleapis.com/youtube/v3/videos?part=snippet`,
        });

        // Check for specific permission errors
        if (response.status === 403) {
          throw new YouTubeAuthError(
            'Insufficient permissions to update video. Please ensure your OAuth token has the youtube.force-ssl scope and you own this video.'
          );
        }

        // Reset response for error handling
        const errorResponse = new Response(errorText, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });

        await this.handleAuthAPIError(errorResponse);
      }

      const data = await response.json();

      // Log successful response for debugging
      console.log('YouTube API Update Success Response:', {
        status: response.status,
        data: data,
        hasItems: !!data.items,
        itemsLength: data.items?.length || 0,
      });

      if (!data.items || data.items.length === 0) {
        console.error('YouTube API returned empty items array:', data);
        throw new YouTubeAPIError(
          `Failed to update video metadata - API returned empty response. Response: ${JSON.stringify(data)}`,
          'UPDATE_FAILED',
          500
        );
      }

      // Return updated video details
      try {
        const transformedVideo = this.transformAuthVideoDetails(data.items[0]);
        console.log('Successfully transformed video data:', {
          videoId: transformedVideo.id,
          title: transformedVideo.title,
        });
        return transformedVideo;
      } catch (transformError) {
        console.error('Error transforming video data:', {
          error: transformError,
          rawVideoData: data.items[0],
        });
        throw new YouTubeAPIError(
          `Failed to transform video data: ${transformError instanceof Error ? transformError.message : 'Unknown error'}`,
          'TRANSFORM_ERROR',
          500
        );
      }
    } catch (error) {
      if (error instanceof YouTubeAPIError) {
        throw error;
      }

      throw new YouTubeAPIError(
        'Failed to update video metadata',
        'UPDATE_ERROR',
        0,
        error
      );
    }
  }*/
  /**
 * Update video metadata (title, description)
 */
async updateVideoMetadata(
  videoId: string,
  updates: { title?: string; description?: string }
): Promise<VideoDetails> {
  try {
    // First verify ownership and get current video details
    const { isOwner } = await this.getVideoDetailsWithOwnership(videoId);

    if (!isOwner) {
      throw new YouTubeAuthError(
        'You can only edit videos from your own YouTube channel.'
      );
    }

    // Get the complete current snippet + status data from YouTube API
    const currentVideoResponse = await this.makeAuthenticatedRequest<{
      items: Array<{
        id: string;
        snippet: {
          title: string;
          description: string;
          channelId: string;
          channelTitle: string;
          categoryId: string;
          publishedAt: string;
          thumbnails: Record<string, unknown>;
          tags?: string[];
        };
        status: {
          privacyStatus: string;
          selfDeclaredMadeForKids?: boolean;
        };
      }>;
    }>('videos', {
      part: 'snippet,status,statistics',
      id: videoId,
    });

    if (!currentVideoResponse.items || currentVideoResponse.items.length === 0) {
      throw new YouTubeNotFoundError('Video not found for update');
    }

    const currentVideo = currentVideoResponse.items[0];
    const currentSnippet = currentVideo.snippet;
    const currentStatus = currentVideo.status;

    // Build updated snippet
    const updatedSnippet = {
      ...currentSnippet,
      title: updates.title ?? currentSnippet.title,
      description: updates.description ?? currentSnippet.description,
      categoryId: currentSnippet.categoryId, // required
    };

    // Build full request payload
    const requestPayload = {
      id: videoId,
      snippet: updatedSnippet,
      status: currentStatus, // preserve status (privacy, madeForKids etc.)
    };

    console.log('YouTube API Update Payload:', JSON.stringify(requestPayload, null, 2));

    // Make the update request
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,status`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('YouTube API Update Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        requestPayload,
      });

      const errorResponse = new Response(errorText, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });

      await this.handleAuthAPIError(errorResponse);
    }

    const data = await response.json();

    console.log('YouTube API Update Success Response:', {
      status: response.status,
      data,
    });

    // Case 1: videos.list style
if (data.items && Array.isArray(data.items) && data.items.length > 0) {
  return this.transformAuthVideoDetails(data.items[0]);
}

// Case 2: videos.update style (single object)
if (data.kind === 'youtube#video' && data.id) {
  type YouTubeVideoItem = {
    id: string;
    snippet: {
      title: string;
      description: string;
      publishedAt: string;
      channelId: string;
      channelTitle: string;
      thumbnails: Record<string, { url: string; width: number; height: number }>;
    };
    statistics?: {
      viewCount?: string;
      likeCount?: string;
      commentCount?: string;
    };
    status?: {
      privacyStatus: string;
    };
  };
  
  return this.transformAuthVideoDetails(data as YouTubeVideoItem);
}

   /* if (!data.items || data.items.length === 0) {
      throw new YouTubeAPIError(
        `Failed to update video metadata - API returned empty response. Response: ${JSON.stringify(
          data
        )}`,
        'UPDATE_FAILED',
        500
      );
    }*/

    return this.transformAuthVideoDetails(data.items[0]);
  } catch (error) {
    if (error instanceof YouTubeAPIError) {
      throw error;
    }

    throw new YouTubeAPIError(
      'Failed to update video metadata',
      'UPDATE_ERROR',
      0,
      error
    );
  }
}

  /**
   * Extract video ID from URL
   */
  private extractVideoIdFromUrl(urlOrId: string): string {
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
   * Transform YouTube API video response to our VideoDetails interface
   */
 
  private transformAuthVideoDetails(item: {
    id: string;
    snippet: {
      title: string;
      description: string;
      publishedAt: string;
      channelId: string;
      channelTitle: string;
      thumbnails: Record<string, { url: string; width: number; height: number }>;
    };
    statistics?: {
      viewCount?: string;
      likeCount?: string;
      commentCount?: string;
    };
    status?: {
      privacyStatus: string;
    };
  }): VideoDetails & { privacyStatus?: string } {
    const thumbnails = Object.values(item.snippet.thumbnails || {}).map((thumb) => ({
      url: thumb.url,
      width: thumb.width,
      height: thumb.height,
    }));
  
    const stats = item.statistics ?? {};
  
    return {
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnails,
      statistics: {
        viewCount: parseInt(stats.viewCount ?? "0", 10),
        likeCount: parseInt(stats.likeCount ?? "0", 10),
        commentCount: parseInt(stats.commentCount ?? "0", 10),
      },
      publishedAt: item.snippet.publishedAt,
      channelId: item.snippet.channelId,
      channelTitle: item.snippet.channelTitle,
      privacyStatus: item.status?.privacyStatus,
    };
  }
  
}

// Factory function to create authenticated service
export const createAuthenticatedYouTubeService = (accessToken: string, apiKey?: string) =>
  new AuthenticatedYouTubeService(accessToken, apiKey);