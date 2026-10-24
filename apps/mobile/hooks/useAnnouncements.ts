import { useCallback, useEffect, useState } from 'react';
import type { Announcement } from '@workspace/shared';
import { apiFetch } from '../lib/api-client';
import { useSession } from './useSession';

export type { Announcement };

// Mirrors apps/web's useAnnouncements() GET side — read-only on mobile for
// now, posting a new announcement stays an admin, web-only action.
export function useAnnouncements(enabled: boolean) {
  const { session } = useSession();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!enabled || !session) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await apiFetch('/api/building/announcements');
      const json = await response.json();
      if (!response.ok) {
        setError(json.error || 'Failed to load announcements');
        return;
      }
      setAnnouncements(json.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }, [enabled, session]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { announcements, loading, error, refetch };
}
