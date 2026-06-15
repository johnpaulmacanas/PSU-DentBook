import { supabase } from '../lib/supabase';
import { sanitize } from '../lib/sanitize';
import { handleSupabaseError } from '../lib/errors';
import type { Doctor, ServiceResult } from '../types';

interface CreateDoctorPayload {
  profile_id: string;
  specialty?: string;
}

export class DoctorService {
  private static readonly BASE_SELECT = '*, profile:profiles(*)';

  static async listAll(): Promise<ServiceResult<Doctor[]>> {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select(DoctorService.BASE_SELECT);

      if (error) return { data: null, error: error.message };
      return { data: data as unknown as Doctor[], error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  static async getById(id: string): Promise<ServiceResult<Doctor>> {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select(DoctorService.BASE_SELECT)
        .eq('id', id)
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as unknown as Doctor, error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  static async create(payload: CreateDoctorPayload): Promise<ServiceResult<Doctor>> {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .insert({
          profile_id: payload.profile_id,
          specialty:  payload.specialty ? sanitize(payload.specialty) : null,
        })
        .select(DoctorService.BASE_SELECT)
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as unknown as Doctor, error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }
}
