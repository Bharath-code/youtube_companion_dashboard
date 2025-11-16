'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { VideoDetails } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, ThumbsUp, MessageCircle, Calendar, Lock, Globe, Users, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

interface VideoListProps {
  onVideoSelect?: (video: VideoDetails) => void;
  className?: string;
}

interface VideoWithStatus extends VideoDetails {
  privacyStatus?: string;
}

export function VideoList({ onVideoSelect, className }: VideoListProps) {
  const router = useRouter();
  const [videos, setVideos] = useState<VideoWithStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [totalResults, setTotalResults] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const { isAuthenticated, requireAuth } = useAuth();

  // Handle video selection
  const handleVideoClick = (video: VideoDetails) => {
    // Call the optional callback
    onVideoSelect?.(video);

    // Navigate to video details page with the video ID pre-filled
    router.push(`/video-details?videoId=${video.id}`);
  };

  // Format numbers for display
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get privacy status icon and color
  const getPrivacyInfo = (privacyStatus?: string) => {
    switch (privacyStatus) {
      case 'public':
        return { icon: Globe, color: 'bg-green-100 text-green-800', label: 'Public' };
      case 'unlisted':
        return { icon: Lock, color: 'bg-orange-100 text-orange-800', label: 'Unlisted' };
      case 'private':
        return { icon: Users, color: 'bg-red-100 text-red-800', label: 'Private' };
      default:
        return { icon: Globe, color: 'bg-gray-100 text-gray-800', label: 'Unknown' };
    }
  };

  // Fetch videos from API
  const fetchVideos = useCallback(async (pageToken?: string, append = false) => {
    if (!requireAuth()) {
      return;
    }

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
    }

    try {
      const params = new URLSearchParams({
        maxResults: '20',
      });

      if (pageToken) {
        params.append('pageToken', pageToken);
      }

      const response = await fetch(`/api/youtube/videos?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch videos');
      }

      if (result.success && result.data) {
        const newVideos = result.data.videos;

        if (append) {
          setVideos(prev => [...prev, ...newVideos]);
        } else {
          setVideos(newVideos);
        }

        setNextPageToken(result.data.nextPageToken);
        setTotalResults(result.data.totalResults);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch videos');

      if (!append) {
        setVideos([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [requireAuth]);

  // Load more videos
  const loadMore = () => {
    if (nextPageToken && !loadingMore) {
      fetchVideos(nextPageToken, true);
    }
  };

  // Refresh videos
  const refresh = () => {
    setVideos([]);
    setNextPageToken(undefined);
    fetchVideos();
  };

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      fetchVideos();
    }
  }, [isAuthenticated, fetchVideos]);

  // Authentication check
  if (!isAuthenticated) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <Users className="w-12 h-12 text-muted-foreground mb-4 mx-auto" />
            <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
            <p className="text-sm text-muted-foreground">
              Please sign in to view your YouTube videos
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Your YouTube Videos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4 mx-auto" />
              <p className="text-sm text-muted-foreground">Loading your videos...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your YouTube Videos</CardTitle>
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Retry
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="text-destructive">
              <h3 className="text-lg font-semibold mb-2">Error Loading Videos</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (videos.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your YouTube Videos</CardTitle>
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">No Videos Found</h3>
            <p className="text-sm text-muted-foreground">
              You haven&apos;t uploaded any videos to your YouTube channel yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Your YouTube Videos</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {totalResults} video{totalResults !== 1 ? 's' : ''} found
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid gap-4">
          {videos.map((video) => {
            const privacyInfo = getPrivacyInfo(video.privacyStatus);
            const PrivacyIcon = privacyInfo.icon;
            const thumbnail = video.thumbnails?.[0];

            return (
              <div
                key={video.id}
                className="flex space-x-4 p-5 md:p-6 border-2 rounded-xl hover:bg-muted/50 hover:border-primary/50 hover:shadow-lg transition-all duration-200 cursor-pointer group hover:scale-[1.01] active:scale-[0.99]"
                onClick={() => handleVideoClick(video)}
              >
                {/* Thumbnail */}
                <div className="relative w-32 h-20 md:w-40 md:h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0 group-hover:ring-2 group-hover:ring-primary/50 transition-all duration-200">
                  {thumbnail ? (
                    <>
                      <Image
                        src={thumbnail.url}
                        alt={video.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                        sizes="(max-width: 768px) 128px, 160px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                      <Eye className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Video Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <h3 className="font-semibold text-sm md:text-base line-clamp-2 flex-1 group-hover:text-primary transition-colors duration-200">
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className={cn(privacyInfo.color, "transition-all duration-200 group-hover:scale-105")}>
                        <PrivacyIcon className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">{privacyInfo.label}</span>
                        <span className="sm:hidden">{privacyInfo.label.charAt(0)}</span>
                      </Badge>
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all duration-200" />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground mb-3">
                    <div className="flex items-center space-x-1.5 px-2 py-1 rounded-md bg-muted/30 group-hover:bg-muted/50 transition-colors duration-200">
                      <Eye className="w-3.5 h-3.5" />
                      <span className="font-medium">{formatNumber(video.statistics.viewCount)}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 px-2 py-1 rounded-md bg-muted/30 group-hover:bg-muted/50 transition-colors duration-200">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span className="font-medium">{formatNumber(video.statistics.likeCount)}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 px-2 py-1 rounded-md bg-muted/30 group-hover:bg-muted/50 transition-colors duration-200">
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span className="font-medium">{formatNumber(video.statistics.commentCount)}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 px-2 py-1 rounded-md bg-muted/30 group-hover:bg-muted/50 transition-colors duration-200">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="font-medium">{formatDate(video.publishedAt)}</span>
                    </div>
                  </div>

                  {video.description && (
                    <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {video.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Load More Button */}
        {nextPageToken && (
          <div className="mt-8 text-center">
            <Button
              variant="outline"
              onClick={loadMore}
              disabled={loadingMore}
              className="gap-2 min-w-[180px]"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More Videos'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}