'use client';

import { useState } from 'react';
import { NotesPanel } from '@/components/features/notes-panel';
import { NoteForm } from '@/components/features/note-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StickyNote, Video, TestTube } from 'lucide-react';

export default function TestNotesUIPage() {
  const [testVideoId, setTestVideoId] = useState('dQw4w9WgXcQ'); // Rick Roll video ID for testing
  const [refreshKey, setRefreshKey] = useState(0);

  const handleNoteCreated = () => {
    // Refresh the notes panel by changing the key
    setRefreshKey(prev => prev + 1);
  };

  const sampleVideoIds = [
    { id: 'dQw4w9WgXcQ', title: 'Rick Astley - Never Gonna Give You Up' },
    { id: 'jNQXAC9IVRw', title: 'Me at the zoo (First YouTube video)' },
    { id: 'kJQP7kiw5Fk', title: 'Luis Fonsi - Despacito ft. Daddy Yankee' },
  ];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <TestTube className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Notes UI Test Page</h1>
            <p className="text-gray-600">Test the notes functionality with different components</p>
          </div>
        </div>

        {/* Video ID Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Test Video Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={testVideoId}
                onChange={(e) => setTestVideoId(e.target.value)}
                placeholder="Enter YouTube video ID"
                className="flex-1"
              />
              <Button onClick={() => setRefreshKey(prev => prev + 1)}>
                Refresh Notes
              </Button>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Quick test videos:</p>
              <div className="flex flex-wrap gap-2">
                {sampleVideoIds.map(video => (
                  <Badge
                    key={video.id}
                    variant={testVideoId === video.id ? "default" : "outline"}
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => setTestVideoId(video.id)}
                  >
                    {video.title}
                  </Badge>
                ))}
              </div>
            </div>

            {testVideoId && (
              <div className="text-sm text-gray-500">
                Current video ID: <code className="bg-gray-100 px-2 py-1 rounded">{testVideoId}</code>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="panel" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="panel">Full Notes Panel</TabsTrigger>
          <TabsTrigger value="form">Note Creation Form</TabsTrigger>
          <TabsTrigger value="combined">Combined View</TabsTrigger>
        </TabsList>

        <TabsContent value="panel" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StickyNote className="w-5 h-5" />
                Full Notes Panel Component
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                This is the complete notes panel with search, filtering, and CRUD operations.
              </p>
              <NotesPanel 
                key={`panel-${refreshKey}`}
                videoId={testVideoId} 
                className="max-w-4xl"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="form" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compact Note Form</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Compact form that expands when clicked.
                </p>
                <NoteForm 
                  videoId={testVideoId}
                  onNoteCreated={handleNoteCreated}
                  compact={true}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Full Note Form</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Always expanded note creation form.
                </p>
                <NoteForm 
                  videoId={testVideoId}
                  onNoteCreated={handleNoteCreated}
                  compact={false}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="combined" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Notes Panel</CardTitle>
                </CardHeader>
                <CardContent>
                  <NotesPanel 
                    key={`combined-${refreshKey}`}
                    videoId={testVideoId}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Add Note</CardTitle>
                </CardHeader>
                <CardContent>
                  <NoteForm 
                    videoId={testVideoId}
                    onNoteCreated={handleNoteCreated}
                    compact={true}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Instructions</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600 space-y-2">
                  <p>• Select a video ID above to test with different videos</p>
                  <p>• Create notes using the form</p>
                  <p>• Search and filter notes in the panel</p>
                  <p>• Edit notes by clicking the edit button</p>
                  <p>• Delete notes using the dropdown menu</p>
                  <p>• Add tags to organize your notes</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}