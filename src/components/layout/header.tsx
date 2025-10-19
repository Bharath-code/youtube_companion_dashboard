"use client"

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { LogOut, User, Youtube } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-white/30 dark:border-white/10 backdrop-blur-xl bg-background/60 supports-[backdrop-filter]:bg-background/40">
      <div className="container flex h-16 items-center justify-between px-4 animate-in fade-in slide-in-from-top-2 duration-500">
        {/* Logo and Title */}
        <Link href="/" className="flex items-center space-x-2">
          <Youtube className="h-6 w-6 text-red-600" />
          <span className="text-xl font-bold">YouTube Companion</span>
        </Link>

        {/* User Profile and Actions */}
        <div className="flex items-center space-x-4">
          {isAuthenticated && user ? (
            <>
              {/* User Profile */}
              <div className="flex items-center space-x-2">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name || 'User'}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                )}
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>

              {/* Logout Button */}
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </>
          ) : (
            <Button asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}