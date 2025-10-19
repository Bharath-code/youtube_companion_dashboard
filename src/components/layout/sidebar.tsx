"use client"

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { 
  Home, 
  Video, 
  StickyNote, 
  Activity,
  Menu,
  X
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
}

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: Home,
    description: 'Overview and quick actions'
  },
  {
    title: 'My Videos',
    href: '/videos',
    icon: Video,
    description: 'Browse and select videos'
  },

  {
    title: 'Events',
    href: '/events',
    icon: Activity,
    description: 'View activity and event statistics'
  }
];

export function Sidebar({ className }: SidebarProps) {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={cn(
      "flex flex-col border-r border-white/20 dark:border-white/10 bg-background/50 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40",
      isCollapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Sidebar Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/20 dark:border-white/10">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold">Navigation</h2>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1 p-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start rounded-md transition-all duration-200 hover:bg-secondary/60 hover:scale-[0.99] active:scale-[0.98]",
                  isCollapsed ? "px-2" : "px-3",
                  isActive && "bg-secondary"
                )}
                title={isCollapsed ? item.title : undefined}
              >
                <Icon className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
                {!isCollapsed && (
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">{item.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  </div>
                )}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="border-t p-4">
        {!isCollapsed && (
          <div className="text-xs text-muted-foreground">
            <p>YouTube Companion Dashboard</p>
            <p>v1.0.0</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Mobile Sidebar Component
export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="md:hidden"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-background/60 backdrop-blur-xl"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="fixed left-0 top-0 h-full w-64 bg-background/70 backdrop-blur-xl border-r border-white/20 dark:border-white/10 shadow-2xl">
            <div className="flex h-16 items-center justify-between px-4 border-b border-white/20 dark:border-white/10">
              <h2 className="text-lg font-semibold">Navigation</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <nav className="space-y-1 p-4">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                  >
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start px-3 rounded-md transition-all duration-200 hover:bg-secondary/60 hover:scale-[0.99] active:scale-[0.98]",
                        isActive && "bg-secondary"
                      )}
                    >
                      <Icon className="h-4 w-4 mr-3" />
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">{item.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      </div>
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}