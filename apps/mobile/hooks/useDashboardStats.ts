import { useCallback, useEffect, useState } from 'react';
import type { DashboardStats } from '@workspace/shared';
import { apiFetch } from '../lib/api-client';
import { useSession } from './useSession';

const EMPTY_STATS: DashboardStats = {
  totalConversations: 0,
  totalMessages: 0,
  userMessages: 0,
  modelMessages: 0,
  dailyMessages: [],
  recentEvents: [],
  eventCounts: {},
};

// Mirrors apps/web's useAnalytics(): same /api/analytics/stats endpoint,
// just fetched through apiFetch (full backend URL + Bearer token) instead
// of a same-origin relative fetch, since mobile has no backend of its own.
export function useDashboardStats() {
  const { session, loading: sessionLoading } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!session) {
      setStats(EMPTY_STATS);
      return;
    }
    setLoading(true);
    try {
      const response = await apiFetch('/api/analytics/stats');
      const json = await response.json();
      if (response.ok && json.data) {
        setStats(json.data);
      }
    } catch {
      setStats(EMPTY_STATS);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!sessionLoading) fetchStats();
  }, [sessionLoading, fetchStats]);

  return { stats, loading: loading || sessionLoading, refreshStats: fetchStats };
}
