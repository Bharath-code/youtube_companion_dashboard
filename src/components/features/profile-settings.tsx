'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Save, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { getUserDisplayName, getUserShortName, hasCustomDisplayName } from '@/lib/utils/user-display';

interface UserProfile {
  id: string;
  name: string | null;
  displayName: string | null;
  username: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ProfileSettingsProps {
  className?: string;
}

export function ProfileSettings({ className }: ProfileSettingsProps) {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Load user profile
  useEffect(() => {
    if (session) {
      fetchProfile();
    }
  }, [session]);

  // Track changes
  useEffect(() => {
    if (profile) {
      const displayChanged = displayName !== (profile.displayName || '');
      const usernameChanged = username !== (profile.username || '');
      setHasChanges(displayChanged || usernameChanged);
    }
  }, [displayName, username, profile]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/profile');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch profile');
      }

      if (result.success && result.data) {
        const profileData = {
          ...result.data,
          createdAt: new Date(result.data.createdAt),
          updatedAt: new Date(result.data.updatedAt),
          emailVerified: result.data.emailVerified ? new Date(result.data.emailVerified) : null,
        };
        setProfile(profileData);
        setDisplayName(result.data.displayName || '');
        setUsername(result.data.username || '');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!hasChanges) return;

    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: displayName.trim() || undefined,
          username: username.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }

      if (result.success && result.data) {
        setProfile(result.data);
        setHasChanges(false);
        toast.success('Profile updated successfully!');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const resetChanges = () => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setUsername(profile.username || '');
      setHasChanges(false);
    }
  };

  if (!session) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Please sign in to manage your profile</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading profile...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !profile) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchProfile} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Profile Settings
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Display Info */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Current Display</h4>
          <div className="flex items-center gap-3">
            {session.user?.image ? (
              <Image
                src={session.user.image}
                alt="Profile"
                width={40}
                height={40}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-medium">
                {profile ? getUserShortName(profile, session) : 'U'}
              </div>
            )}
            <div>
              <p className="font-medium">
                {profile ? getUserDisplayName(profile, session) : 'Loading...'}
              </p>
              <p className="text-sm text-gray-500">{session.user?.email}</p>
              {profile && hasCustomDisplayName(profile) && (
                <Badge variant="secondary" className="text-xs mt-1">
                  Custom Name
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* OAuth Name (Read-only) */}
        <div className="space-y-2">
          <Label>OAuth Name (from Google)</Label>
          <Input
            value={profile?.name || session.user?.name || ''}
            disabled
            className="bg-gray-50"
          />
          <p className="text-xs text-gray-500">
            This is your name from Google and cannot be changed here.
          </p>
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your preferred display name"
            maxLength={50}
          />
          <p className="text-xs text-gray-500">
            This is how your name will appear in notes and throughout the app.
          </p>
        </div>

        {/* Username */}
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
            placeholder="Enter a unique username"
            maxLength={30}
          />
          <p className="text-xs text-gray-500">
            Optional. Can contain letters, numbers, underscores, and hyphens.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-4">
          <Button
            onClick={saveProfile}
            disabled={!hasChanges || saving}
            className="flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>

          {hasChanges && (
            <Button
              variant="outline"
              onClick={resetChanges}
              disabled={saving}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
          )}

          {!hasChanges && profile && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <Check className="w-4 h-4" />
              Profile up to date
            </div>
          )}
        </div>

        {/* Usage Info */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">How Names Work</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Display Name</strong>: Shown in notes, comments, and UI</li>
            <li>• <strong>Username</strong>: Optional unique identifier</li>
            <li>• <strong>OAuth Name</strong>: From your Google account (read-only)</li>
            <li>• If no custom name is set, your OAuth name is used</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}