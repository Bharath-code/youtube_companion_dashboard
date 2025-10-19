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
      {/* Background gradient + noise overlay */}
      <div className="pointer-events-none fixed inset-0 -z-10 [background-blend-mode:overlay] bg-[radial-gradient(ellipse_at_top_left,_rgba(99,102,241,0.12),transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(236,72,153,0.12),transparent_55%),radial-gradient(ellipse_at_center,_rgba(14,165,233,0.10),transparent_60%)]" />
      <div className="noise-overlay" />

      {/* Header */}
      <Header />
      
      <div className="flex">
        {/* Desktop Sidebar */}
        {isAuthenticated && (
          <aside className="hidden md:block">
            <Sidebar />
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {/* Mobile Sidebar Button */}
          <div className="md:hidden p-4 border-b">
            <MobileSidebar />
          </div>
          
          {/* Page Content */}
          <div className="px-6 py-8 md:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}