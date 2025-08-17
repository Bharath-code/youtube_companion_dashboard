"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Video, MessageSquare, StickyNote, Activity } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { user, isLoading, isAuthenticated } = useAuth();

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
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {isAuthenticated ? `Welcome back, ${user?.name}!` : 'Welcome to YouTube Companion Dashboard'}
        </h1>
        <p className="text-lg text-muted-foreground">
          {isAuthenticated
            ? "You're ready to manage your YouTube videos with comprehensive tools."
            : "Sign in with your Google account to start managing your YouTube videos."
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
              <p className="text-muted-foreground mb-6">
                Access all your video management tools from the sidebar or use the quick actions below.
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button asChild variant="outline" className="h-auto p-4 flex-col space-y-2">
                  <Link href="/videos">
                    <Video className="h-6 w-6" />
                    <span>Manage Videos</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto p-4 flex-col space-y-2">
                  <Link href="/comments">
                    <MessageSquare className="h-6 w-6" />
                    <span>View Comments</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto p-4 flex-col space-y-2">
                  <Link href="/notes">
                    <StickyNote className="h-6 w-6" />
                    <span>My Notes</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto p-4 flex-col space-y-2">
                  <Link href="/activity">
                    <Activity className="h-6 w-6" />
                    <span>Activity Log</span>
                  </Link>
                </Button>
              </div>
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
              <MessageSquare className="h-5 w-5" />
              <span>Comment Management</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Read, reply to, and manage comments on your videos. Engage with your audience effectively.
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
