'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { NotesPanel } from '@/components/features/notes-panel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StickyNote, Search, Tag, Video } from 'lucide-react';

export default function NotesPage() {
  const { data: session } = useSession();
  const [filterVideoId, setFilterVideoId] = useState<string>('');
  const [showVideoFilter, setShowVideoFilter] = useState(true);

  if (!session) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              <StickyNote className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="mb-4">Please sign in to view and manage your notes</p>
              <Button asChild>
                <a href="/auth/signin">Sign In</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  const handleVideoFilterChange = (value: string) => {
    const videoId = value.trim() ? extractVideoId(value.trim()) : '';
    setFilterVideoId(videoId);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 md:space-y-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="space-y-4 md:space-y-6">
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold flex items-center gap-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            <div className="p-2 rounded-lg bg-primary/10">
              <StickyNote className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            Notes by Video
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-3xl leading-relaxed">
            Notes are attached to individual videos. Pick a video to jot ideas.
          </p>
        </div>

        {/* Video Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Video className="w-5 h-5" />
              Filter by Video
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVideoFilter(!showVideoFilter)}
              >
                {showVideoFilter ? 'Hide Filter' : 'Filter by Video'}
              </Button>
              {filterVideoId && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Video: {filterVideoId}
                  <button
                    onClick={() => {
                      setFilterVideoId('');
                      setShowVideoFilter(false);
                    }}
                    className="ml-1 hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>

            {showVideoFilter && (
              <div className="space-y-2">
                <Input
                  placeholder="Enter YouTube video URL or ID to filter notes..."
                  onChange={(e) => handleVideoFilterChange(e.target.value)}
                  className="max-w-md"
                />
                <p className="text-xs text-muted-foreground">
                  Enter a YouTube video URL or video ID to see notes for that specific video only.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" size="default" className="gap-2">
            <a href="/videos">
              Browse My Videos
            </a>
          </Button>
          <Button asChild variant="outline" size="default" className="gap-2">
            <a href="/test-search">
              <Search className="w-4 h-4" />
              Test Search Features
            </a>
          </Button>
        </div>
      </div>

      {/* Notes Panel */}
      {filterVideoId ? (
        <NotesPanel 
          videoId={filterVideoId}
          className="min-h-[600px]"
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select a Video to View Notes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Enter a video URL/ID above or browse your videos to access notes for a specific video.
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How to Use Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <Search className="w-4 h-4" />
                Search Features
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Type in the search box to find notes instantly</li>
                <li>• Search suggestions appear as you type</li>
                <li>• Search works on both content and tags</li>
                <li>• Click suggestions to use them</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4" />
                Tagging System
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Add tags when creating or editing notes</li>
                <li>• Press Enter or comma to add tags</li>
                <li>• Click available tags to filter notes</li>
                <li>• Tags help organize and find notes quickly</li>
              </ul>
            </div>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">💡 Pro Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use descriptive tags like &quot;tutorial&quot;, &quot;idea&quot;, &quot;bug&quot;, &quot;feature&quot;</li>
              <li>• Search for partial words to find related content</li>
              <li>• Filter by video to see notes for specific content</li>
              <li>• Edit notes anytime by clicking the edit button</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}