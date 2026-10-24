import { useCallback, useEffect, useState } from 'react';
import type { Fee } from '@workspace/shared';
import { apiFetch } from '../lib/api-client';
import { useSession } from './useSession';

export type { Fee };

// Mirrors apps/web's useFees(): same /api/building/fees endpoint. Read-only
// here — marking a fee paid/generating fees stays an admin, web-only action
// for now; a resident checking what they owe is the mobile use case.
export function useFees(enabled: boolean) {
  const { session } = useSession();
  const [fees, setFees] = useState<Fee[]>([]);
  const [totals, setTotals] = useState({ collected: 0, outstanding: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!enabled || !session) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await apiFetch('/api/building/fees');
      const json = await response.json();
      if (!response.ok) {
        setError(json.error || 'Failed to load fees');
        return;
      }
      setFees(json.data);
      setTotals(json.totals ?? { collected: 0, outstanding: 0 });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fees');
    } finally {
      setLoading(false);
    }
  }, [enabled, session]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { fees, totals, loading, error, refetch };
}
