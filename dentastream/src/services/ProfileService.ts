import { supabase } from '../lib/supabase';
import { sanitize } from '../lib/sanitize';
import { handleSupabaseError } from '../lib/errors';
import type { Profile, ServiceResult } from '../types';

export class ProfileService {
  static async getById(id: string): Promise<ServiceResult<Profile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as Profile, error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  static async update(
    id: string,
    updates: Partial<Pick<Profile, 'full_name' | 'contact' | 'address' | 'birthdate' | 'sex'>>
  ): Promise<ServiceResult<Profile>> {
    try {
      const sanitized: Partial<Profile> = {};
      if (updates.full_name) sanitized.full_name = sanitize(updates.full_name);
      if (updates.contact)   sanitized.contact   = sanitize(updates.contact);
      if (updates.address)   sanitized.address   = sanitize(updates.address);
      // birthdate is a DATE string (yyyy-mm-dd); sex is a constrained enum value.
      if (updates.birthdate !== undefined) sanitized.birthdate = updates.birthdate;
      if (updates.sex !== undefined)       sanitized.sex       = updates.sex;

      const { data, error } = await supabase
        .from('profiles')
        .update(sanitized)
        .eq('id', id)
        .select()
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as Profile, error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  /** All profiles (admin-only via RLS). Used for staff and channel-member pickers. */
  static async listAll(): Promise<ServiceResult<Profile[]>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      if (error) return { data: null, error: error.message };
      return { data: data as Profile[], error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  static async listByRole(role: Profile['role']): Promise<ServiceResult<Profile[]>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', role)
        .order('full_name');

      if (error) return { data: null, error: error.message };
      return { data: data as Profile[], error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }
}
