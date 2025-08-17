'use client';

import React from 'react';
import Image from 'next/image';
import { VideoDetails } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, ThumbsUp, MessageCircle, Calendar, User, ExternalLink, Lock, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface VideoDetailsCardProps {
  video: VideoDetails | null;
  loading?: boolean;
  error?: string | null;
  onEdit?: () => void;
  className?: string;
  isOwner?: boolean;
  isUnlisted?: boolean;
}

export function VideoDetailsCard({ 
  video, 
  loading = false, 
  error = null, 
  onEdit,
  className,
  isOwner = false,
  isUnlisted = false
}: VideoDetailsCardProps) {
  const { isAuthenticated } = useAuth();
  // Loading state
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="aspect-video bg-gray-200 rounded-lg"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
            <div className="flex space-x-4">
              <div className="h-8 bg-gray-200 rounded w-20"></div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
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
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-destructive text-center">
            <h3 className="text-lg font-semibold mb-2">Error Loading Video</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Authentication check
  if (!isAuthenticated) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <Shield className="w-12 h-12 text-muted-foreground mb-4 mx-auto" />
            <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
            <p className="text-sm text-muted-foreground">
              Please sign in to access your YouTube videos
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No video state
  if (!video) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">No Video Selected</h3>
            <p className="text-sm text-muted-foreground">
              Enter your YouTube video URL or ID to view details
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Note: You can only access videos from your own channel
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
      month: 'long',
      day: 'numeric',
    });
  };

  // Get the best thumbnail (prefer high quality)
  const getBestThumbnail = () => {
    if (!video.thumbnails || video.thumbnails.length === 0) {
      return null;
    }
    
    // Sort by width descending to get the highest quality
    const sortedThumbnails = [...video.thumbnails].sort((a, b) => b.width - a.width);
    return sortedThumbnails[0];
  };

  const thumbnail = getBestThumbnail();

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <CardTitle className="text-xl font-bold leading-tight line-clamp-2">
                {video.title}
              </CardTitle>
              {isUnlisted && (
                <div className="flex items-center space-x-1 bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium shrink-0">
                  <Lock className="w-3 h-3" />
                  <span>Unlisted</span>
                </div>
              )}
              {isOwner && (
                <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium shrink-0">
                  <Shield className="w-3 h-3" />
                  <span>Your Video</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <User className="w-4 h-4" />
                <span className="truncate">{video.channelTitle}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(video.publishedAt)}</span>
              </div>
            </div>
          </div>
          {onEdit && isOwner && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onEdit}
              className="ml-4 shrink-0"
            >
              Edit Metadata
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Video Thumbnail */}
        {thumbnail && (
          <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={thumbnail.url}
              alt={video.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <Button
                variant="secondary"
                size="sm"
                asChild
                className="bg-white/90 hover:bg-white text-black"
              >
                <a
                  href={`https://www.youtube.com/watch?v=${video.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Watch on YouTube</span>
                </a>
              </Button>
            </div>
          </div>
        )}

        {/* Video Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
            <Eye className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-sm font-medium">{formatNumber(video.statistics.viewCount)}</div>
              <div className="text-xs text-muted-foreground">Views</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
            <ThumbsUp className="w-5 h-5 text-green-600" />
            <div>
              <div className="text-sm font-medium">{formatNumber(video.statistics.likeCount)}</div>
              <div className="text-xs text-muted-foreground">Likes</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
            <MessageCircle className="w-5 h-5 text-purple-600" />
            <div>
              <div className="text-sm font-medium">{formatNumber(video.statistics.commentCount)}</div>
              <div className="text-xs text-muted-foreground">Comments</div>
            </div>
          </div>
        </div>

        {/* Video Description */}
        {video.description && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Description</h4>
            <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
              <p className="whitespace-pre-wrap line-clamp-6">
                {video.description}
              </p>
            </div>
          </div>
        )}

        {/* Video Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <span className="font-medium">Video ID:</span>
            <code className="block text-xs bg-muted p-2 rounded font-mono break-all">
              {video.id}
            </code>
          </div>
          <div className="space-y-1">
            <span className="font-medium">Channel ID:</span>
            <code className="block text-xs bg-muted p-2 rounded font-mono break-all">
              {video.channelId}
            </code>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}