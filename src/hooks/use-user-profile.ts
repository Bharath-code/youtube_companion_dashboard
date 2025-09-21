import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { User } from '@prisma/client';

interface UseUserProfileReturn {
  profile: User | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useUserProfile(): UseUserProfileReturn {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!session) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/profile');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch profile');
      }

      if (result.success && result.data) {
        setProfile(result.data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
  };
}