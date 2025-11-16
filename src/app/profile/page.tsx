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
    <div className="container mx-auto p-4 md:p-6 space-y-6 md:space-y-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-3">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold flex items-center gap-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          <div className="p-2 rounded-lg bg-primary/10">
            <User className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          Profile Settings
        </h1>
        <p className="text-base md:text-lg text-muted-foreground max-w-3xl leading-relaxed">
          Manage your display name and profile preferences.
        </p>
      </div>

      <ProfileSettings className="max-w-2xl" />
    </div>
  );
}