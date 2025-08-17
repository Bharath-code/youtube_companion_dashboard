// Core application types

// Re-export database types
export * from './database'

// YouTube API types
export interface VideoDetails {
  id: string;
  title: string;
  description: string;
  thumbnails: Thumbnail[];
  statistics: VideoStatistics;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
}

export interface Thumbnail {
  url: string;
  width: number;
  height: number;
}

export interface VideoStatistics {
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

export interface Comment {
  id: string;
  textDisplay: string;
  authorDisplayName: string;
  authorProfileImageUrl: string;
  authorChannelId?: string;
  publishedAt: string;
  likeCount: number;
  replies?: Comment[];
}

// Video update interface for editing metadata
export interface VideoUpdate {
  title?: string;
  description?: string;
}

// API Response types
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// YouTube service error types
export interface YouTubeErrorDetails {
  code: string;
  message: string;
  status?: number;
  details?: unknown;
}

// Re-export YouTube service types
export type {
  YouTubeAPIVideoResponse,
  YouTubeAPIVideoItem,
  YouTubeAPIThumbnail,
  YouTubeAPICommentsResponse,
  YouTubeAPICommentItem,
  YouTubeAPICommentReply,
  YouTubeAPIError,
  YouTubeRateLimitError,
  YouTubeAuthError,
  YouTubeNotFoundError,
  YouTubeCommentsDisabledError,
  YouTubeService
} from '../services/youtube';
