import { VideoDetails, Comment, APIResponse } from '@/lib/types';

/**
 * Client-side helper functions for YouTube API integration
 */

/**
 * Fetch video details from our API endpoint
 */
export async function fetchVideoDetails(videoId: string): Promise<VideoDetails> {
  const response = await fetch(`/api/youtube/video?id=${encodeURIComponent(videoId)}`);
  const result: APIResponse<VideoDetails> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch video details');
  }

  return result.data;
}

/**
 * Fetch video comments from our API endpoint
 */
export async function fetchVideoComments(
  videoId: string,
  maxResults: number = 20,
  pageToken?: string
): Promise<{ comments: Comment[]; nextPageToken?: string }> {
  const params = new URLSearchParams({
    id: videoId,
    maxResults: maxResults.toString(),
  });

  if (pageToken) {
    params.append('pageToken', pageToken);
  }

  const response = await fetch(`/api/youtube/comments?${params.toString()}`);
  const result: APIResponse<{ comments: Comment[]; nextPageToken?: string }> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch video comments');
  }

  return result.data;
}

/**
 * Extract video ID from YouTube URL or validate existing ID
 */
export function extractVideoId(urlOrId: string): string {
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

  throw new Error('Invalid YouTube URL or video ID format');
}

/**
 * Validate if a string is a valid YouTube video ID
 */
export function isValidVideoId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{11}$/.test(id);
}

/**
 * Validate if a string is a valid YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  try {
    extractVideoId(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format view count for display (e.g., 1.2M, 15K)
 */
export function formatViewCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

/**
 * Format duration from ISO 8601 format (PT4M13S) to readable format (4:13)
 */
export function formatDuration(duration: string): string {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';

  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format published date for display
 */
export function formatPublishedDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} month${months !== 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years} year${years !== 1 ? 's' : ''} ago`;
  }
}

/**
 * Get the best thumbnail URL from available thumbnails
 */
export function getBestThumbnail(thumbnails: { url: string; width: number; height: number }[]): string {
  if (thumbnails.length === 0) return '';
  
  // Sort by resolution (width * height) and return the highest quality
  const sorted = thumbnails.sort((a, b) => (b.width * b.height) - (a.width * a.height));
  return sorted[0].url;
}

/**
 * Truncate text to specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Generate YouTube video URL from video ID
 */
export function generateYouTubeUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Generate YouTube embed URL from video ID
 */
export function generateEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}