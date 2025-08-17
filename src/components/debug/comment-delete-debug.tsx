'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function CommentDeleteDebug() {
  const { data: session } = useSession();
  const [testResults, setTestResults] = useState<any>(null);

  const testCommentAPI = async () => {
    try {
      // Test with a known video ID
      const response = await fetch('/api/youtube/comments?id=dQw4w9WgXcQ&maxResults=5');
      const result = await response.json();
      setTestResults(result);
    } catch (error) {
      setTestResults({ error: error.message });
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>🐛 Comment Delete Debug Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session Info */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">Session Information</h3>
          <pre className="text-xs bg-white p-2 rounded overflow-auto">
            {JSON.stringify({
              hasSession: !!session,
              user: session?.user,
              youtubeChannelId: session?.youtubeChannelId,
              youtubeChannelTitle: session?.youtubeChannelTitle,
              accessToken: session?.accessToken ? 'Present' : 'Missing'
            }, null, 2)}
          </pre>
        </div>

        {/* Test Comments API */}
        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold mb-2">Test Comments API</h3>
          <Button onClick={testCommentAPI} className="mb-2">
            Fetch Test Comments
          </Button>
          {testResults && (
            <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-96">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          )}
        </div>

        {/* Instructions */}
        <div className="p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-semibold mb-2">Debug Steps</h3>
          <ol className="text-sm space-y-1">
            <li>1. Check if session has YouTube channel ID</li>
            <li>2. Test if comments API returns author channel IDs</li>
            <li>3. Verify if your comments show up with matching channel ID</li>
            <li>4. Check browser console for detailed logs</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}