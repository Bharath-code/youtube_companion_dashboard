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
    <div className="min-h-screen bg-background">
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
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}