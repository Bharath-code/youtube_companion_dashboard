'use client';

import { ProfileSettings } from '@/components/features/profile-settings';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';

export default function ProfilePage() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="mb-4">Please sign in to manage your profile</p>
              <Button asChild>
                <a href="/auth/signin">Sign In</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <User className="w-8 h-8" />
          Profile Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your display name and profile preferences.
        </p>
      </div>

      <ProfileSettings className="max-w-2xl" />
    </div>
  );
}