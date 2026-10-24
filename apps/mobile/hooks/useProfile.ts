import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { UserProfile } from '@workspace/shared';
import { supabase } from '../lib/supabase';
import { apiFetch } from '../lib/api-client';

type UpdateResult = { success: boolean; error?: string };

// Mirrors apps/web's useProfile(): same /api/profile PUT endpoint, same
// field shapes. No localStorage-style cache priming (web does this to
// avoid a flash on SSR-less client nav; not worth the complexity here).
// uploadAvatar is NOT ported — needs expo-image-picker (File-based upload),
// explicitly deferred like the rest of file upload for mobile.
export function useProfile(session: Session | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = session?.user.id;

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) {
        setError(fetchError.message);
        return;
      }
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchProfile();
  }, [userId, fetchProfile]);

  async function putProfile(fields: Record<string, unknown>): Promise<UpdateResult> {
    if (!session) return { success: false, error: 'Not authenticated' };

    try {
      const response = await apiFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(fields),
      });
      const json = await response.json();

      if (!response.ok) return { success: false, error: json.error };

      setProfile(json.data);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Update failed' };
    }
  }

  const updateUsername = (newUsername: string) => putProfile({ username: newUsername });
  const updateBio = (newBio: string) => putProfile({ bio: newBio });
  const updateVisibility = (isPublic: boolean) => putProfile({ is_public: isPublic });
  const updateExtended = (fields: {
    display_name?: string | null;
    location?: string | null;
    website?: string | null;
    twitter_handle?: string | null;
    github_handle?: string | null;
  }) => putProfile(fields);

  return {
    profile,
    loading,
    error,
    updateUsername,
    updateBio,
    updateExtended,
    updateVisibility,
    refetch: fetchProfile,
  };
}
