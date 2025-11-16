"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Video, StickyNote, User } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { VideoDetails } from '@/lib/types';
import { VideoDetailsCard } from '@/components/features/video-details-card';
import { VideoEditor } from '@/components/features/video-editor';
import { CommentsSection } from '@/components/features/comments-section';
import { NotesPanel } from '@/components/features/notes-panel';

// Minimal shape used for dashboard summary
type DashboardVideoSummary = {
  privacyStatus?: 'public' | 'unlisted' | 'private';
  statistics?: { viewCount?: string; commentCount?: string };
};


export default function Home() {
  const { user, isLoading, isAuthenticated } = useAuth();

  const [summary, setSummary] = useState<{
    totalVideos: number;
    publicCount: number;
    unlistedCount: number;
    privateCount: number;
    totalViews: number;
    totalComments: number;
  } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
  const [videoMeta, setVideoMeta] = useState<{ isOwner: boolean; isUnlisted: boolean } | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchSummary = async () => {
      setSummaryLoading(true);
      setSummaryError(null);
      try {
        const response = await fetch('/api/youtube/videos?maxResults=50');
        const result = await response.json();

        if (!response.ok || !result.success || !result.data) {
          throw new Error(result.error || 'Failed to fetch videos');
        }

        const { videos, totalResults } = result.data as { videos: DashboardVideoSummary[]; totalResults?: number };

        const publicCount = videos.filter((v) => v.privacyStatus === 'public').length;
        const unlistedCount = videos.filter((v) => v.privacyStatus === 'unlisted').length;
        const privateCount = videos.filter((v) => v.privacyStatus === 'private').length;

        const totalViews = videos.reduce((sum, v) => {
          const views = parseInt(v.statistics?.viewCount ?? '0', 10);
          return sum + (isNaN(views) ? 0 : views);
        }, 0);

        const totalComments = videos.reduce((sum, v) => {
          const comments = parseInt(v.statistics?.commentCount ?? '0', 10);
          return sum + (isNaN(comments) ? 0 : comments);
        }, 0);

        setSummary({
          totalVideos: typeof totalResults === 'number' ? totalResults : videos.length,
          publicCount,
          unlistedCount,
          privateCount,
          totalViews,
          totalComments,
        });

        // Select latest video (first entry) for quick details panel
        if (videos.length > 0) {
          const firstId = (videos as Array<{ id?: string }>)[0]?.id as string | undefined;
          if (firstId) {
            setSelectedVideoId(firstId);
          }
        }
      } catch (err) {
        setSummaryError(err instanceof Error ? err.message : 'Failed to load summary');
        setSummary(null);
      } finally {
        setSummaryLoading(false);
      }
    };

    fetchSummary();
  }, [isAuthenticated]);

  // Fetch selected video details with ownership validation
  useEffect(() => {
    const loadVideo = async () => {
      if (!isAuthenticated || !selectedVideoId) return;
      setVideoLoading(true);
      setVideoError(null);
      try {
        const res = await fetch(`/api/youtube/video/${selectedVideoId}`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to load video');
        }
        const { video, isOwner, isUnlisted } = json.data as { video: VideoDetails; isOwner: boolean; isUnlisted: boolean };
        setVideoDetails(video);
        setVideoMeta({ isOwner, isUnlisted });
      } catch (e) {
        setVideoError(e instanceof Error ? e.message : 'Failed to load video');
        setVideoDetails(null);
        setVideoMeta(null);
      } finally {
        setVideoLoading(false);
      }
    };
    loadVideo();
  }, [isAuthenticated, selectedVideoId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-sky-600 dark:from-indigo-400 dark:via-fuchsia-400 dark:to-sky-400">
          {isAuthenticated ? `Welcome back, ${user?.name}!` : 'YouTube Companion Dashboard'}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          {isAuthenticated
            ? "Elevate your YouTube workflow with insights, notes, and smart actions — all in one place."
            : "Sign in with your Google account to organize videos, manage comments, and keep powerful notes together."
          }
        </p>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isAuthenticated ? 'Dashboard Overview' : 'Get Started'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isAuthenticated ? (
            <>
              <div className="rounded-xl p-6 mb-6 border bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-sky-500/10 dark:from-indigo-500/15 dark:via-purple-500/15 dark:to-sky-500/15 backdrop-blur-xl">
                <h3 className="font-semibold mb-2">✨ Unified, frictionless management</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Manage video metadata, explore insights, and capture notes in a single, cohesive experience.
                </p>
                <div className="flex gap-2">
                  <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Link href="/videos">Browse My Videos</Link>
                  </Button>
                </div>
              </div>
              
              <p className="text-muted-foreground mb-6">
                Access tools from the sidebar or use quick actions below.
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Button asChild variant="outline" className="h-auto p-4 flex-col space-y-2">
                  <Link href="/videos">
                    <Video className="h-6 w-6" />
                    <span>Browse Videos</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto p-4 flex-col space-y-2">
                  <Link href="/profile">
                    <User className="h-6 w-6" />
                    <span>Profile</span>
                  </Link>
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Dashboard Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {summaryLoading ? (
                    <div className="text-sm text-muted-foreground">Loading summary...</div>
                  ) : summaryError ? (
                    <div className="text-sm text-red-500">{summaryError}</div>
                  ) : summary ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="rounded-xl border bg-card p-4">
                        <div className="text-sm text-muted-foreground">Videos Uploaded</div>
                        <div className="text-2xl font-bold">{summary.totalVideos}</div>
                      </div>
                      <div className="rounded-xl border bg-card p-4">
                        <div className="text-sm text-muted-foreground">Public</div>
                        <div className="text-2xl font-bold">{summary.publicCount}</div>
                      </div>
                      <div className="rounded-xl border bg-card p-4">
                        <div className="text-sm text-muted-foreground">Unlisted</div>
                        <div className="text-2xl font-bold">{summary.unlistedCount}</div>
                      </div>
                      <div className="rounded-xl border bg-card p-4">
                        <div className="text-sm text-muted-foreground">Private</div>
                        <div className="text-2xl font-bold">{summary.privateCount}</div>
                      </div>
                      <div className="rounded-xl border bg-card p-4">
                        <div className="text-sm text-muted-foreground">Total Views (recent)</div>
                        <div className="text-2xl font-bold">{summary.totalViews.toLocaleString()}</div>
                      </div>
                      <div className="rounded-xl border bg-card p-4">
                        <div className="text-sm text-muted-foreground">Total Comments (recent)</div>
                        <div className="text-2xl font-bold">{summary.totalComments.toLocaleString()}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No data available.</div>
                  )}
                </CardContent>
              </Card>

              {/* Inline Latest Video Panel */}
              {selectedVideoId && (
                <div className="mt-8 grid gap-6">
                  <VideoDetailsCard
                    video={videoDetails}
                    loading={videoLoading}
                    error={videoError}
                    isOwner={!!videoMeta?.isOwner}
                    isUnlisted={!!videoMeta?.isUnlisted}
                    onEdit={() => setEditing(true)}
                  />

                  {editing && videoDetails && (
                    <VideoEditor
                      video={videoDetails}
                      onSave={async (updates) => {
                        const res = await fetch(`/api/youtube/video/${selectedVideoId}/update`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(updates),
                        });
                        const json = await res.json();
                        if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update');
                        // Refresh details
                        setEditing(false);
                        setSelectedVideoId(selectedVideoId);
                      }}
                      onCancel={() => setEditing(false)}
                    />
                  )}

                  {/* Comments and Notes for selected video */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <CommentsSection videoId={selectedVideoId} />
                    <NotesPanel videoId={selectedVideoId} />
                  </div>
                </div>
              )}

              
            </>
          ) : (
            <>
              <p className="text-muted-foreground mb-4">
                Sign in with your Google account to access these features:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
                <li>View and edit video details</li>
                <li>Manage comments and replies</li>
                <li>Take and organize notes</li>
                <li>Track all interactions with event logging</li>
              </ul>
              <Button asChild>
                <Link href="/auth/signin">Sign In to Get Started</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Feature Overview Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Video className="h-5 w-5" />
              <span>Video Management</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              View video statistics, edit titles and descriptions, and manage your content with YouTube API integration.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="inline-flex items-center gap-2">
                <Video className="h-5 w-5" />
                <StickyNote className="h-5 w-5" />
              </span>
              <span>Integrated Management</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Edit video metadata and manage notes in one unified interface. No more switching between tabs!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <StickyNote className="h-5 w-5" />
              <span>Notes & Organization</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Keep track of ideas, feedback, and improvements with searchable notes and tagging system.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
