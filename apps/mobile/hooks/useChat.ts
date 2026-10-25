import { useCallback, useEffect, useRef, useState } from 'react';
import type { BuildingChatMessage } from '@workspace/shared';
import { apiFetch } from '../lib/api-client';
import { supabase } from '../lib/supabase';
import { useSession } from './useSession';
import { useI18n } from './useI18n';

export type { BuildingChatMessage };

const FALLBACK_POLL_MS = 6000;

// Mirrors apps/web's useChat(): live via a Supabase Realtime channel
// (WebSocket) subscribed to INSERTs on building_chat_messages, filtered to
// this building. React Native's global WebSocket (which Expo provides) is
// what realtime-js uses under the hood here, same as the browser's
// WebSocket on web. A slow poll runs alongside it as a fallback — see
// apps/web's useChat() for why.
export function useChat(enabled: boolean, buildingId: string | undefined) {
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
    if (!enabled || !session || !buildingId) return;
    const channel = supabase
      .channel(`building-chat-${buildingId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'building_chat_messages', filter: `building_id=eq.${buildingId}` },
        () => {
          if (!sendingRef.current) refetch();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, session, buildingId, refetch]);

  useEffect(() => {
    if (!enabled || !session) return;
    const interval = setInterval(() => {
      if (!sendingRef.current) refetch();
    }, FALLBACK_POLL_MS);
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
