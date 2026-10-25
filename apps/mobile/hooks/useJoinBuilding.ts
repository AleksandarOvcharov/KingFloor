import { useState } from 'react';
import type { Building, JoinableUnit } from '@workspace/shared';
import { apiFetch } from '../lib/api-client';
import { useI18n } from './useI18n';

// Mirrors apps/web's useJoinBuilding(): resolve an invite code to the
// building + its free units (GET /api/building/lookup), then claim one
// (POST /api/building/join). Mobile only ever joins as a resident — creating
// a building (the admin-only "I manage this building" path) stays a web-only
// flow for now, since it's a one-time setup task better done at a keyboard.
export function useJoinBuilding() {
  const { t } = useI18n();
  const [result, setResult] = useState<{
    building: Pick<Building, 'id' | 'name' | 'address'>;
    units: JoinableUnit[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const lookup = async (code: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const response = await apiFetch(`/api/building/lookup?code=${encodeURIComponent(code)}`);
      const json = await response.json();
      if (!response.ok) {
        setResult(null);
        return { success: false, error: json.error };
      }
      setResult(json.data);
      return { success: true };
    } catch (err) {
      setResult(null);
      return { success: false, error: err instanceof Error ? err.message : t.errors.generic };
    } finally {
      setLoading(false);
    }
  };

  const reset = () => setResult(null);

  const join = async (code: string, unitId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiFetch('/api/building/join', {
        method: 'POST',
        body: JSON.stringify({ invite_code: code, unit_id: unitId }),
      });
      const json = await response.json();
      if (!response.ok) return { success: false, error: json.error };
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : t.errors.generic };
    }
  };

  return { result, loading, lookup, join, reset };
}
