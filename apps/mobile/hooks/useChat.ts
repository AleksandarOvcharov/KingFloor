import { useCallback, useEffect, useRef, useState } from 'react';
import type { BuildingChatMessage } from '@workspace/shared';
import { apiFetch } from '../lib/api-client';
import { useSession } from './useSession';
import { useI18n } from './useI18n';

export type { BuildingChatMessage };

const POLL_INTERVAL_MS = 4000;

// Mirrors apps/web's useChat(): polls instead of a real Supabase Realtime
// subscription — simplest thing that keeps a shared building chat feeling
// alive without wiring up a channel on top of apiFetch.
export function useChat(enabled: boolean) {
  const { session } = useSession();
  const { t } = useI18n();
  const [messages, setMessages] = useState<BuildingChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sendingRef = useRef(false);

  const refetch = useCallback(async () => {
    if (!enabled || !session) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await apiFetch('/api/building/chat');
      const json = await response.json();
      if (!response.ok) {
        setError(json.error || t.errors.generic);
        return;
      }
      setMessages(json.data);
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

  useEffect(() => {
    if (!enabled || !session) return;
    const interval = setInterval(() => {
      if (!sendingRef.current) refetch();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [enabled, session, refetch]);

  const sendMessage = async (body: string): Promise<{ success: boolean; error?: string }> => {
    sendingRef.current = true;
    try {
      const response = await apiFetch('/api/building/chat', {
        method: 'POST',
        body: JSON.stringify({ body }),
      });
      const json = await response.json();
      if (!response.ok) return { success: false, error: json.error };
      setMessages((prev) => [...prev, json.data]);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : t.errors.generic };
    } finally {
      sendingRef.current = false;
    }
  };

  return { messages, loading, error, refetch, sendMessage };
}
