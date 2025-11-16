"use client"

import { Header } from './header';
import { Sidebar, MobileSidebar } from './sidebar';
import { useAuth } from '@/hooks/use-auth';
import { ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen relative isolate">
      {/* Enhanced Background gradient + noise overlay */}
      <div className="pointer-events-none fixed inset-0 -z-10 [background-blend-mode:overlay] bg-[radial-gradient(ellipse_at_top_left,_rgba(99,102,241,0.15),transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(236,72,153,0.15),transparent_55%),radial-gradient(ellipse_at_center,_rgba(14,165,233,0.12),transparent_60%)] animate-pulse-slow" />
      <div className="noise-overlay opacity-30" />
      
      {/* Animated gradient orb effects */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Header */}
      <Header />
      
      <div className="flex">
        {/* Desktop Sidebar */}
        {isAuthenticated && (
          <aside className="hidden md:block transition-all duration-300">
            <Sidebar />
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-hidden min-h-[calc(100vh-4rem)]">
          {/* Mobile Sidebar Button */}
          <div className="md:hidden p-4 border-b border-white/20 dark:border-white/10 bg-background/50 backdrop-blur-sm">
            <MobileSidebar />
          </div>
          
          {/* Page Content */}
          <div className="px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-10 max-w-7xl mx-auto w-full">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}