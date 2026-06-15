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
