'use client';

import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { CommentsSection } from '@/components/features/comments-section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function TestCommentsPage() {
  const { data: session, status } = useSession();
  const [videoId, setVideoId] = useState('');
  const [currentVideoId, setCurrentVideoId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (videoId.trim()) {
      setCurrentVideoId(videoId.trim());
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

    return urlOrId; // Return as-is if no pattern matches
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Comments Section Test</h1>
        <p className="text-gray-600">
          Test the YouTube comments fetching, posting, and management functionality.
        </p>

        {/* Authentication status */}
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
          {status === 'loading' && (
            <p className="text-sm text-gray-600">Loading authentication...</p>
          )}
          {status === 'authenticated' && session && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-green-700">
                <strong>Signed in as:</strong> {session.user?.name || session.user?.email}
              </p>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                Sign Out
              </Button>
            </div>
          )}
          {status === 'unauthenticated' && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Sign in to post comments and replies
              </p>
              <Button variant="outline" size="sm" onClick={() => signIn('google')}>
                Sign In with Google
              </Button>
            </div>
          )}
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Enter Video ID or URL</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="videoId">YouTube Video ID or URL</Label>
              <Input
                id="videoId"
                type="text"
                value={videoId}
                onChange={(e) => setVideoId(e.target.value)}
                placeholder="e.g., dQw4w9WgXcQ or https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                className="mt-1"
              />
            </div>
            <Button type="submit" disabled={!videoId.trim()}>
              Load Comments
            </Button>
          </form>
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="font-medium text-blue-900 mb-2">Test Examples:</h4>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Video with comments:</strong>{' '}
                <button
                  type="button"
                  onClick={() => setVideoId('dQw4w9WgXcQ')}
                  className="text-blue-600 hover:underline"
                >
                  dQw4w9WgXcQ
                </button>
                {' '}(Rick Astley - Never Gonna Give You Up)
              </div>
              <div>
                <strong>Video with disabled comments:</strong>{' '}
                <span className="text-gray-600">Try any video that has comments disabled</span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Note: Some videos may have comments disabled by the creator, which will show a friendly message instead of an error.
              </div>
            </div>
          </div>

          {currentVideoId && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-700">
                <strong>Current Video ID:</strong> {extractVideoId(currentVideoId)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <CommentsSection
        videoId={currentVideoId ? extractVideoId(currentVideoId) : ''}
        className="w-full"
      />
    </div>
  );
}