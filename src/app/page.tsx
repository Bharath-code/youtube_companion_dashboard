"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, LogOut, User } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header with authentication status */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                YouTube Companion Dashboard
              </h1>
              <p className="text-lg text-muted-foreground">
                Comprehensive management for your YouTube videos
              </p>
            </div>
            
            {isAuthenticated && user && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span className="text-sm font-medium">{user.name}</span>
                </div>
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            )}
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {isAuthenticated ? `Welcome back, ${user?.name}!` : 'Welcome to Your Dashboard'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isAuthenticated ? (
                <>
                  <p className="text-muted-foreground mb-4">
                    You&apos;re successfully signed in and ready to manage your YouTube videos.
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
                    <li>View and edit video details</li>
                    <li>Manage comments and replies</li>
                    <li>Take and organize notes</li>
                    <li>Track all interactions with event logging</li>
                  </ul>
                  <Button>Manage Videos</Button>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground mb-4">
                    Sign in with your Google account to start managing your YouTube videos.
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

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Video Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  View video statistics, edit titles and descriptions, and
                  manage your content.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notes & Organization</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Keep track of ideas, feedback, and improvements with
                  searchable notes.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
