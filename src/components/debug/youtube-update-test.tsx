'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';

export function YouTubeUpdateTest() {
  const [videoId, setVideoId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const { isAuthenticated } = useAuth();

  const testUpdate = async () => {
    if (!videoId.trim() || !title.trim()) {
      setResult('Please provide both video ID and title');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      const response = await fetch(`/api/youtube/video/${videoId}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ Success: ${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ Error: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      setResult(`❌ Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Please sign in to test YouTube API updates
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>YouTube Update API Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Video ID</label>
          <Input
            value={videoId}
            onChange={(e) => setVideoId(e.target.value)}
            placeholder="Enter YouTube video ID (11 characters)"
            maxLength={11}
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">New Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter new video title"
            maxLength={100}
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">New Description (optional)</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter new video description"
            rows={4}
            maxLength={5000}
          />
        </div>
        
        <Button 
          onClick={testUpdate} 
          disabled={loading || !videoId.trim() || !title.trim()}
          className="w-full"
        >
          {loading ? 'Testing...' : 'Test Update API'}
        </Button>
        
        {result && (
          <div className="mt-4">
            <label className="text-sm font-medium">Result:</label>
            <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-auto max-h-96">
              {result}
            </pre>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          <p><strong>Note:</strong> This will only work with videos you own. Check the browser console for detailed API logs.</p>
        </div>
      </CardContent>
    </Card>
  );
}