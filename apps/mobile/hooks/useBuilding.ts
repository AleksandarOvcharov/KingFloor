import { useCallback, useEffect, useState } from 'react';
import type { BuildingMembership } from '@workspace/shared';
import { apiFetch } from '../lib/api-client';
import { useSession } from './useSession';

export type { BuildingMembership };

// Mirrors apps/web's useBuilding(): same /api/building endpoint, fetched
// through apiFetch (full backend URL + Bearer token) since mobile has no
// backend of its own. `membership: null` once loaded means the signed-in
// resident hasn't joined/created a building yet.
export function useBuilding() {
  const { session, loading: sessionLoading } = useSession();
  const [membership, setMembership] = useState<BuildingMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!session) {
      setMembership(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await apiFetch('/api/building');
      const json = await response.json();
      if (!response.ok) {
        setError(json.error || 'Failed to load building');
        return;
      }
      setMembership(json.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load building');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!sessionLoading) refetch();
  }, [sessionLoading, refetch]);

  return { membership, loading: loading || sessionLoading, error, refetch };
}
