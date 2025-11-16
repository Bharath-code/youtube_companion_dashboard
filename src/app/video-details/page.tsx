'use client';

import React, { useState } from 'react';
import { VideoDetailsCard } from '@/components/features/video-details-card';
import { VideoEditor } from '@/components/features/video-editor';
import { CommentsSection } from '@/components/features/comments-section';
import { NotesPanel } from '@/components/features/notes-panel';
import { VideoList } from '@/components/features/video-list';

import { VideoDetails, VideoUpdate } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { Edit, MessageCircle, Info, StickyNote } from 'lucide-react';

export default function VideoDetailsPage() {
  const [videoUrl, setVideoUrl] = useState('');
  const [video, setVideo] = useState<VideoDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isUnlisted, setIsUnlisted] = useState(false);
  const { isAuthenticated, requireAuth } = useAuth();

  // Check for videoId in URL parameters
  const handleFetchVideoById = React.useCallback(async (videoId: string) => {
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
  }, [requireAuth]);

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
  }, [isAuthenticated, handleFetchVideoById]);

  // Separate function to fetch video by ID (for URL parameter handling)

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
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error updating video:', error);
      throw error; // Re-throw to let VideoEditor handle the error display
    }
  };

  

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Video Management</h1>



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


          </Tabs>
        )}

        {/* Show uploads list when no video is selected */}
        {!video && (
          <VideoList />
        )}
      </div>
    </div>
  );
}