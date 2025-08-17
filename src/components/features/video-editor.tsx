'use client';

import React, { useState, useEffect } from 'react';
import { VideoDetails, VideoUpdate } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Save, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface VideoEditorProps {
  video: VideoDetails;
  onSave: (updates: VideoUpdate) => Promise<void>;
  onCancel: () => void;
  className?: string;
}

export function VideoEditor({ video, onSave, onCancel, className }: VideoEditorProps) {
  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description);
  const [loading, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { isAuthenticated } = useAuth();

  // Track changes
  useEffect(() => {
    const titleChanged = title !== video.title;
    const descriptionChanged = description !== video.description;
    setHasChanges(titleChanged || descriptionChanged);
  }, [title, description, video.title, video.description]);

  // Reset success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleSave = async () => {
    if (!isAuthenticated) {
      setError('Authentication required');
      return;
    }

    if (!hasChanges) {
      setError('No changes to save');
      return;
    }

    // Basic validation
    if (!title.trim()) {
      setError('Title cannot be empty');
      return;
    }

    if (title.length > 100) {
      setError('Title must be 100 characters or less');
      return;
    }

    if (description.length > 5000) {
      setError('Description must be 5000 characters or less');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const updates: VideoUpdate = {};
      
      if (title !== video.title) {
        updates.title = title.trim();
      }
      
      if (description !== video.description) {
        updates.description = description;
      }

      await onSave(updates);
      setSuccess(true);
      setHasChanges(false);
    } catch (err) {
      console.error('Error saving video:', err);
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmCancel = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel?'
      );
      if (!confirmCancel) {
        return;
      }
    }
    
    // Reset form
    setTitle(video.title);
    setDescription(video.description);
    setError(null);
    setSuccess(false);
    setHasChanges(false);
    
    onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Save on Ctrl/Cmd + S
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (hasChanges && !loading) {
        handleSave();
      }
    }
    
    // Cancel on Escape
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <Card className={className} onKeyDown={handleKeyDown}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Edit Video Metadata</span>
          <div className="flex items-center space-x-2">
            {success && (
              <div className="flex items-center space-x-1 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Saved!</span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={loading}
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <div>
              <strong>Error:</strong> {error}
            </div>
          </Alert>
        )}

        {/* Title Field */}
        <div className="space-y-2">
          <Label htmlFor="video-title">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="video-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter video title"
            maxLength={100}
            disabled={loading}
            className={title.length > 90 ? 'border-orange-300' : ''}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Required field</span>
            <span className={title.length > 90 ? 'text-orange-600' : ''}>
              {title.length}/100 characters
            </span>
          </div>
        </div>

        {/* Description Field */}
        <div className="space-y-2">
          <Label htmlFor="video-description">Description</Label>
          <Textarea
            id="video-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter video description"
            rows={8}
            maxLength={5000}
            disabled={loading}
            className={`resize-none ${description.length > 4500 ? 'border-orange-300' : ''}`}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Optional field</span>
            <span className={description.length > 4500 ? 'text-orange-600' : ''}>
              {description.length}/5000 characters
            </span>
          </div>
        </div>

        {/* Video Info */}
        <div className="bg-muted/30 p-4 rounded-lg">
          <h4 className="text-sm font-semibold mb-2">Video Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Video ID:</span>
              <code className="block text-xs bg-background p-2 rounded mt-1 font-mono">
                {video.id}
              </code>
            </div>
            <div>
              <span className="font-medium">Channel:</span>
              <div className="text-muted-foreground mt-1">
                {video.channelTitle}
              </div>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded">
          <strong>Keyboard shortcuts:</strong> Ctrl/Cmd + S to save, Escape to cancel
        </div>
      </CardContent>
    </Card>
  );
}