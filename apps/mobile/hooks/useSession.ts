import { useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Mirrors apps/web's useAuth(): restores the persisted session (stored via
// LargeSecureStore) on mount, then stays in sync with sign-in/sign-out.
// Extracted once a second screen (ai.tsx) needed the same tracking that
// profile.tsx already had.
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Supabase refreshes the access token on app foreground/token expiry,
  // firing onAuthStateChange with a logically-identical session as a *new*
  // object reference each time. useBuilding/useFees/useAnnouncements/
  // usePolls all key their fetch effects on this hook's `session`, so a new
  // reference for the same user triggers a refetch storm across all of them
  // on every foreground. Keep the previous reference whenever the user id
  // didn't actually change — mirrors apps/web/hooks/useAuth.ts's applyUser.
  const lastUserIdRef = useRef<string | null>(null);
  const applySession = (next: Session | null) => {
    const nextId = next?.user.id ?? null;
    lastUserIdRef.current = nextId;
    setSession((prev) => (prev?.user.id === nextId && next ? prev : next));
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      applySession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      applySession(newSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return { session, loading };
}
