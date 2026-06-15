import { supabase } from '../lib/supabase';
import { sanitize } from '../lib/sanitize';
import { handleSupabaseError } from '../lib/errors';
import type { Patient, ServiceResult } from '../types';

interface CreatePatientPayload {
  profile_id: string;
  patient_code: string;
  age?: number;
  gender?: 'M' | 'F' | 'other';
  medical_notes?: string;
}

export class PatientService {
  private static readonly BASE_SELECT = '*, profile:profiles(*)';

  static async listAll(): Promise<ServiceResult<Patient[]>> {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select(PatientService.BASE_SELECT)
        .order('patient_code');

      if (error) return { data: null, error: error.message };
      return { data: data as unknown as Patient[], error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  static async getById(id: string): Promise<ServiceResult<Patient>> {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select(PatientService.BASE_SELECT)
        .eq('id', id)
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as unknown as Patient, error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  /** Find a patient row by its owning profile id. data is null if none exists. */
  static async getByProfileId(profileId: string): Promise<ServiceResult<Patient | null>> {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select(PatientService.BASE_SELECT)
        .eq('profile_id', profileId)
        .maybeSingle();

      if (error) return { data: null, error: error.message };
      return { data: (data as unknown as Patient | null) ?? null, error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  /**
   * Returns the patient row for a profile, creating one (with a generated
   * patient_code) if it does not exist yet. Used when approving a request.
   */
  static async getOrCreateByProfile(profileId: string): Promise<ServiceResult<Patient>> {
    const existing = await PatientService.getByProfileId(profileId);
    if (existing.error) return { data: null, error: existing.error };
    if (existing.data) return { data: existing.data, error: null };

    const patientCode = `P-${Date.now().toString(36).toUpperCase()}`;
    return PatientService.create({ profile_id: profileId, patient_code: patientCode });
  }

  static async update(
    id: string,
    updates: Partial<Pick<Patient, 'age' | 'gender' | 'medical_notes'>>
  ): Promise<ServiceResult<Patient>> {
    try {
      const patch: Record<string, unknown> = {};
      if (updates.age !== undefined) patch.age = updates.age;
      if (updates.gender !== undefined) patch.gender = updates.gender;
      if (updates.medical_notes !== undefined) {
        patch.medical_notes = updates.medical_notes ? sanitize(updates.medical_notes) : null;
      }

      const { data, error } = await supabase
        .from('patients')
        .update(patch)
        .eq('id', id)
        .select(PatientService.BASE_SELECT)
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as unknown as Patient, error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  static async create(payload: CreatePatientPayload): Promise<ServiceResult<Patient>> {
    try {
      const { data, error } = await supabase
        .from('patients')
        .insert({
          profile_id:    payload.profile_id,
          patient_code:  sanitize(payload.patient_code),
          age:           payload.age ?? null,
          gender:        payload.gender ?? null,
          medical_notes: payload.medical_notes ? sanitize(payload.medical_notes) : null,
        })
        .select(PatientService.BASE_SELECT)
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as unknown as Patient, error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }
}
