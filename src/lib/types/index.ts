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
  publishedAt: string;
  likeCount: number;
  replies?: Comment[];
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
