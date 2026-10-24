import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Mirrors apps/web's useAuth(): restores the persisted session (stored via
// LargeSecureStore) on mount, then stays in sync with sign-in/sign-out.
// Extracted once a second screen (ai.tsx) needed the same tracking that
// profile.tsx already had.
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return { session, loading };
}
