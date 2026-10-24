import { useCallback, useEffect, useState } from 'react';
import type { Poll } from '@workspace/shared';
import { apiFetch } from '../lib/api-client';
import { useSession } from './useSession';

export type { Poll };

// Mirrors apps/web's usePolls(): list + vote. Creating/closing a poll stays
// an admin, web-only action — casting the vote itself is the one write
// action residents most want to do right from their phone.
export function usePolls(enabled: boolean) {
  const { session } = useSession();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!enabled || !session) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await apiFetch('/api/building/polls');
      const json = await response.json();
      if (!response.ok) {
        setError(json.error || 'Failed to load votes');
        return;
      }
      setPolls(json.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load votes');
    } finally {
      setLoading(false);
    }
  }, [enabled, session]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const castVote = async (pollId: string, optionId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiFetch(`/api/building/polls/${pollId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ option_id: optionId }),
      });
      const json = await response.json();
      if (!response.ok) return { success: false, error: json.error };
      await refetch();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to vote' };
    }
  };

  return { polls, loading, error, refetch, castVote };
}
