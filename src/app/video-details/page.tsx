'use client';

import React, { useState } from 'react';
import { VideoDetailsCard } from '@/components/features/video-details-card';
import { VideoEditor } from '@/components/features/video-editor';
import { CommentsSection } from '@/components/features/comments-section';
import { NotesPanel } from '@/components/features/notes-panel';
import { YouTubeUpdateTest } from '@/components/debug/youtube-update-test';
import { VideoDetails, VideoUpdate } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { Edit, MessageCircle, Info, Settings, StickyNote } from 'lucide-react';

export default function VideoDetailsPage() {
  const [videoUrl, setVideoUrl] = useState('');
  const [video, setVideo] = useState<VideoDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isUnlisted, setIsUnlisted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { isAuthenticated, requireAuth } = useAuth();

  // Check for videoId in URL parameters
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('videoId');
    if (videoId) {
      setVideoUrl(videoId);
      // Auto-fetch the video if we have a videoId in the URL
      if (isAuthenticated) {
        handleFetchVideoById(videoId);
      }
    }
  }, [isAuthenticated]);

  // Separate function to fetch video by ID (for URL parameter handling)
  const handleFetchVideoById = async (videoId: string) => {
    if (!requireAuth()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/youtube/video/${videoId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch video details');
      }

      if (result.success && result.data) {
        setVideo(result.data.video);
        setIsOwner(result.data.isOwner);
        setIsUnlisted(result.data.isUnlisted);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching video:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch video details');
      setVideo(null);
      setIsOwner(false);
      setIsUnlisted(false);
    } finally {
      setLoading(false);
    }
  };

  const extractVideoId = (urlOrId: string): string => {
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
  };

  const handleFetchVideo = async () => {
    if (!requireAuth()) {
      return;
    }

    if (!videoUrl.trim()) {
      setError('Please enter a YouTube video URL or ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const videoId = extractVideoId(videoUrl);

      const response = await fetch(`/api/youtube/video/${videoId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch video details');
      }

      if (result.success && result.data) {
        setVideo(result.data.video);
        setIsOwner(result.data.isOwner);
        setIsUnlisted(result.data.isUnlisted);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching video:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch video details');
      setVideo(null);
      setIsOwner(false);
      setIsUnlisted(false);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = async (updates: VideoUpdate) => {
    if (!video) return;

    try {
      const response = await fetch(`/api/youtube/video/${video.id}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update video');
      }

      if (result.success && result.data) {
        // Update the video state with the new data
        setVideo(result.data);
        setIsEditing(false);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error updating video:', error);
      throw error; // Re-throw to let VideoEditor handle the error display
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFetchVideo();
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Video Management</h1>

        {/* Video URL Input */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Enter Your YouTube Video URL or ID</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Input
                type="text"
                placeholder="https://www.youtube.com/watch?v=... or video ID"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFetchVideo()}
                className="flex-1"
                disabled={!isAuthenticated}
              />
              <Button
                onClick={handleFetchVideo}
                disabled={loading || !isAuthenticated}
              >
                {loading ? 'Loading...' : 'Fetch Video'}
              </Button>
            </div>
            {!isAuthenticated && (
              <p className="text-sm text-muted-foreground mt-2">
                Please sign in to access your YouTube videos
              </p>
            )}
          </CardContent>
        </Card>

        {/* Main Content - Tabbed Interface */}
        {video && (
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="details" className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                Details
              </TabsTrigger>
              <TabsTrigger value="edit" className="flex items-center gap-2" disabled={!isOwner}>
                <Edit className="w-4 h-4" />
                Edit
              </TabsTrigger>
              <TabsTrigger value="comments" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Comments
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex items-center gap-2">
                <StickyNote className="w-4 h-4" />
                Notes
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Advanced
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-6">
              <VideoDetailsCard
                video={video}
                loading={loading}
                error={error}
                onEdit={() => {}} // Disabled since we have a dedicated edit tab
                isOwner={isOwner}
                isUnlisted={isUnlisted}
              />
            </TabsContent>

            <TabsContent value="edit" className="mt-6">
              {isOwner ? (
                <VideoEditor
                  video={video}
                  onSave={handleSaveEdit}
                  onCancel={() => {}} // No cancel needed in tab context
                />
              ) : (
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center text-gray-500">
                      <Edit className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>You can only edit videos from your own YouTube channel.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="comments" className="mt-6">
              <CommentsSection videoId={video.id} />
            </TabsContent>

            <TabsContent value="notes" className="mt-6">
              <NotesPanel videoId={video.id} />
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <div className="space-y-6">
                {/* API Update Test */}
                <Card>
                  <CardHeader>
                    <CardTitle>API Update Test</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <YouTubeUpdateTest />
                  </CardContent>
                </Card>

                {/* Test States */}
                <Card>
                  <CardHeader>
                    <CardTitle>Test Different States</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setVideo(null);
                          setLoading(false);
                          setError(null);
                          setIsEditing(false);
                          setIsOwner(false);
                          setIsUnlisted(false);
                        }}
                      >
                        Test Empty State
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setVideo(null);
                          setLoading(true);
                          setError(null);
                          setIsEditing(false);
                        }}
                      >
                        Test Loading State
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setVideo(null);
                          setLoading(false);
                          setError('This is a test error message');
                          setIsEditing(false);
                        }}
                      >
                        Test Error State
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Show video details card when no video is loaded */}
        {!video && (
          <VideoDetailsCard
            video={video}
            loading={loading}
            error={error}
            onEdit={handleEdit}
            isOwner={isOwner}
            isUnlisted={isUnlisted}
          />
        )}
      </div>
    </div>
  );
}