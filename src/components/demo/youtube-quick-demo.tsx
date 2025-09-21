'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Play, Eye, ThumbsUp, MessageSquare } from 'lucide-react';
import { fetchVideoDetails } from '@/lib/utils/youtube-helpers';
import { VideoDetails } from '@/lib/types';
import { formatViewCount, getBestThumbnail } from '@/lib/utils/youtube-helpers';

export function YouTubeQuickDemo() {
  const [videoId, setVideoId] = useState('dQw4w9WgXcQ'); // Default Rick Roll
  const [video, setVideo] = useState<VideoDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDemo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const details = await fetchVideoDetails(videoId);
      setVideo(details);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Play className="h-5 w-5" />
          <span>YouTube API Demo</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Input
            placeholder="Enter YouTube video ID"
            value={videoId}
            onChange={(e) => setVideoId(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleDemo} disabled={loading || !videoId}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Fetch'}
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {video && (
          <div className="space-y-4">
            <div className="aspect-video bg-gray-100 rounded overflow-hidden">
              <Image
                src={getBestThumbnail(video.thumbnails)}
                alt={video.title}
                width={640}
                height={360}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-1">{video.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {video.channelTitle}
              </p>
              
              <div className="flex space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>{formatViewCount(video.statistics.viewCount)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <ThumbsUp className="h-4 w-4" />
                  <span>{formatViewCount(video.statistics.likeCount)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{formatViewCount(video.statistics.commentCount)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}