'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { NotesPanel } from '@/components/features/notes-panel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Tag, TestTube } from 'lucide-react';

export default function TestSearchPage() {
  const { data: session } = useSession();
  const [testVideoId, setTestVideoId] = useState('dQw4w9WgXcQ'); // Rick Roll video ID for testing

  if (!session) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">Please sign in to test the search functionality</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Notes Search & Tagging Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Test Video ID:</label>
            <Input
              value={testVideoId}
              onChange={(e) => setTestVideoId(e.target.value)}
              placeholder="Enter YouTube video ID for testing"
            />
            <p className="text-xs text-gray-500">
              Using video ID: {testVideoId} (Rick Astley - Never Gonna Give You Up)
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Features to Test:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Search Features
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Real-time search filtering</li>
                  <li>• Search suggestions dropdown</li>
                  <li>• Content and tag search</li>
                  <li>• Search result highlighting</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Tagging Features
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Tag input with Enter/comma</li>
                  <li>• Tag-based filtering</li>
                  <li>• Available tags display</li>
                  <li>• Tag frequency in suggestions</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Test Instructions:</h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Create some notes with different tags (e.g., &quot;tutorial&quot;, &quot;music&quot;, &quot;favorite&quot;)</li>
              <li>2. Try searching for content within your notes</li>
              <li>3. Test tag filtering by clicking on available tags</li>
              <li>4. Use the search suggestions that appear as you type</li>
              <li>5. Verify that search results update in real-time</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <NotesPanel videoId={testVideoId} />
    </div>
  );
}