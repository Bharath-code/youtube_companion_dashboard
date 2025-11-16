"use client"

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { 
  Home, 
  Video, 
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
      "flex flex-col border-r border-white/20 dark:border-white/10 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50 shadow-lg transition-all duration-300",
      isCollapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Sidebar Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/20 dark:border-white/10">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Navigation
          </h2>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0 hover:bg-primary/10"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-2 p-3 md:p-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start rounded-lg transition-all duration-200 group/nav relative overflow-hidden",
                  isCollapsed ? "px-2" : "px-3",
                  isActive && "bg-primary/10 text-primary shadow-sm hover:bg-primary/15",
                  !isActive && "hover:bg-accent/50 hover:text-accent-foreground"
                )}
                title={isCollapsed ? item.title : undefined}
              >
                <Icon className={cn(
                  "h-4 w-4 transition-transform duration-200 group-hover/nav:scale-110",
                  !isCollapsed && "mr-3",
                  isActive && "text-primary"
                )} />
                {!isCollapsed && (
                  <div className="flex flex-col items-start flex-1">
                    <span className={cn(
                      "text-sm font-medium transition-colors",
                      isActive && "text-primary"
                    )}>
                      {item.title}
                    </span>
                    <span className="text-xs text-muted-foreground group-hover/nav:text-foreground/70 transition-colors">
                      {item.description}
                    </span>
                  </div>
                )}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                )}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="border-t border-white/20 dark:border-white/10 p-4">
        {!isCollapsed && (
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium">YouTube Companion</p>
            <p>Dashboard v1.0.0</p>
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
        <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="fixed left-0 top-0 h-full w-64 bg-background/95 backdrop-blur-xl border-r border-white/20 dark:border-white/10 shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="flex h-16 items-center justify-between px-4 border-b border-white/20 dark:border-white/10">
              <h2 className="text-lg font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Navigation
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0 hover:bg-primary/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <nav className="space-y-2 p-4">
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
                        "w-full justify-start px-3 rounded-lg transition-all duration-200 group/nav relative overflow-hidden",
                        isActive && "bg-primary/10 text-primary shadow-sm hover:bg-primary/15",
                        !isActive && "hover:bg-accent/50 hover:text-accent-foreground"
                      )}
                    >
                      <Icon className={cn(
                        "h-4 w-4 mr-3 transition-transform duration-200 group-hover/nav:scale-110",
                        isActive && "text-primary"
                      )} />
                      <div className="flex flex-col items-start flex-1">
                        <span className={cn(
                          "text-sm font-medium transition-colors",
                          isActive && "text-primary"
                        )}>
                          {item.title}
                        </span>
                        <span className="text-xs text-muted-foreground group-hover/nav:text-foreground/70 transition-colors">
                          {item.description}
                        </span>
                      </div>
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                      )}
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