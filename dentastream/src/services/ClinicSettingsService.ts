import { supabase } from '../lib/supabase';
import { handleSupabaseError } from '../lib/errors';
import type { ServiceResult } from '../types';

export class ClinicSettingsService {
  /** Returns all settings as a flat key→value map. */
  static async getAll(): Promise<ServiceResult<Record<string, string>>> {
    try {
      const { data, error } = await supabase
        .from('clinic_settings')
        .select('key, value');

      if (error) return { data: null, error: error.message };

      const map: Record<string, string> = {};
      for (const row of data ?? []) {
        map[(row as { key: string }).key] = (row as { value: string }).value;
      }
      return { data: map, error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  /** Insert or update a single setting. Admin-only (RLS enforced). */
  static async upsert(key: string, value: string): Promise<ServiceResult<boolean>> {
    try {
      const { error } = await supabase
        .from('clinic_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

      if (error) return { data: null, error: error.message };
      return { data: true, error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  /** Batch-update multiple settings at once. */
  static async upsertMany(settings: Record<string, string>): Promise<ServiceResult<boolean>> {
    try {
      const now = new Date().toISOString();
      const rows = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        updated_at: now,
      }));

      const { error } = await supabase
        .from('clinic_settings')
        .upsert(rows, { onConflict: 'key' });

      if (error) return { data: null, error: error.message };
      return { data: true, error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }
}
