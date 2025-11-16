"use client"

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { LogOut, User, Youtube } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-white/30 dark:border-white/10 backdrop-blur-xl bg-background/80 supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6 animate-in fade-in slide-in-from-top-2 duration-500">
        {/* Logo and Title */}
        <Link 
          href="/" 
          className="flex items-center space-x-2 group transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <div className="relative">
            <Youtube className="h-7 w-7 text-red-600 transition-transform duration-200 group-hover:scale-110" />
            <div className="absolute inset-0 bg-red-600/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent group-hover:from-primary group-hover:to-primary/70 transition-all duration-200">
            YouTube Companion
          </span>
        </Link>

        {/* User Profile and Actions */}
        <div className="flex items-center space-x-3 md:space-x-4">
          {isAuthenticated && user ? (
            <>
              {/* User Profile */}
              <div className="flex items-center space-x-2 md:space-x-3 group/profile">
                {user.image ? (
                  <div className="relative">
                    <Image
                      src={user.image}
                      alt={user.name || 'User'}
                      width={32}
                      height={32}
                      className="h-9 w-9 rounded-full ring-2 ring-primary/20 group-hover/profile:ring-primary/40 transition-all duration-200 group-hover/profile:scale-110"
                    />
                    <div className="absolute inset-0 bg-primary/10 rounded-full blur-md opacity-0 group-hover/profile:opacity-100 transition-opacity duration-200 -z-10" />
                  </div>
                ) : (
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center ring-2 ring-primary/20 group-hover/profile:ring-primary/40 transition-all duration-200 group-hover/profile:scale-110">
                    <User className="h-4 w-4" />
                  </div>
                )}
                <div className="hidden sm:block transition-all duration-200">
                  <p className="text-sm font-medium group-hover/profile:text-primary transition-colors">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[150px]">{user.email}</p>
                </div>
              </div>

              {/* Logout Button */}
              <Button variant="outline" size="sm" onClick={logout} className="gap-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </>
          ) : (
            <Button asChild className="gap-2">
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}