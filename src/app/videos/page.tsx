'use client';

import { useState } from 'react';
import { VideoList } from '@/components/features/video-list';
import { VideoDetailsCard } from '@/components/features/video-details-card';
import { VideoEditor } from '@/components/features/video-editor';
import { VideoDetails, VideoUpdate } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function VideosPage() {
  const [selectedVideo, setSelectedVideo] = useState<VideoDetails | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { } = useAuth();

  const handleVideoSelect = (video: VideoDetails) => {
    setSelectedVideo(video);
    setIsEditing(false);
  };

  const handleBackToList = () => {
    setSelectedVideo(null);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = async (updates: VideoUpdate) => {
    if (!selectedVideo) return;

    try {
      const response = await fetch(`/api/youtube/video/${selectedVideo.id}/update`, {
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
        // Update the selected video with the new data
        setSelectedVideo(result.data);
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

  // Show video list if no video is selected
  if (!selectedVideo) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Your YouTube Videos</h1>
          <p className="text-muted-foreground">
            Select a video to view details and manage metadata and comments.
          </p>
        </div>

        <VideoList onVideoSelect={handleVideoSelect} />
      </div>
    );
  }

  // Show video details or editor
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={handleBackToList}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Videos
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? 'Edit Video' : 'Video Details'}
          </h1>
          <p className="text-muted-foreground">
            {selectedVideo.title}
          </p>
        </div>
      </div>

      {isEditing ? (
        <VideoEditor
          video={selectedVideo}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
        />
      ) : (
        <VideoDetailsCard
          video={selectedVideo}
          onEdit={handleEdit}
          isOwner={true} // User's own videos are always owned by them
          isUnlisted={(selectedVideo as VideoDetails & { privacyStatus?: string }).privacyStatus === 'unlisted'}
        />
      )}
    </div>
  );
}