import { useCallback, useEffect, useState } from 'react';
import type { Announcement } from '@workspace/shared';
import { apiFetch } from '../lib/api-client';
import { useSession } from './useSession';
import { useI18n } from './useI18n';

export type { Announcement };

// Mirrors apps/web's useAnnouncements() GET side — read-only on mobile for
// now, posting a new announcement stays an admin, web-only action.
export function useAnnouncements(enabled: boolean) {
  const { session } = useSession();
  const { t } = useI18n();
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
        setError(json.error || t.errors.generic);
        return;
      }
      setAnnouncements(json.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errors.generic);
    } finally {
      setLoading(false);
    }
  }, [enabled, session, t]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { announcements, loading, error, refetch };
}
