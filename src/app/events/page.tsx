'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface EventStats {
  [eventType: string]: number;
}

export default function EventsPage() {
  const { status } = useSession();
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchEventStats();
    } else if (status === 'unauthenticated') {
      setLoading(false);
      setError('Please sign in to view event statistics');
    }
  }, [status]);

  const fetchEventStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/events/stats');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch event statistics');
      }

      if (result.success) {
        setStats(result.data);
      }
    } catch (err) {
      console.error('Error fetching event stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load event statistics');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Event Statistics</h1>
        <p className="text-muted-foreground mt-2">
          View your activity and engagement statistics
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats && Object.entries(stats).map(([eventType, count]) => (
          <Card key={eventType}>
            <CardHeader>
              <CardTitle className="text-lg capitalize">
                {eventType.replace(/([A-Z])/g, ' $1').trim()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{count}</div>
              <p className="text-muted-foreground text-sm">Total events</p>
            </CardContent>
          </Card>
        ))}
        
        {stats && Object.keys(stats).length === 0 && (
          <Card className="col-span-full">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No events recorded yet. Start using the application to see your statistics.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}