import { supabase } from '../lib/supabase';
import { sanitize } from '../lib/sanitize';
import { handleSupabaseError } from '../lib/errors';
import type { Prescription, ServiceResult } from '../types';

interface CreatePrescriptionPayload {
  appointment_id: string;
  prescribed_by: string;     // doctor profile id
  medication: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  notes?: string;
}

export class PrescriptionService {
  private static readonly BASE_SELECT = `
    *,
    appointment:appointments(
      *,
      patient:patients(*, profile:profiles(*)),
      doctor:doctors(*, profile:profiles(*))
    )
  `;

  static async create(payload: CreatePrescriptionPayload): Promise<ServiceResult<Prescription>> {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .insert({
          appointment_id: payload.appointment_id,
          prescribed_by:  payload.prescribed_by,
          medication:     sanitize(payload.medication),
          dosage:         payload.dosage    ? sanitize(payload.dosage)    : null,
          frequency:      payload.frequency ? sanitize(payload.frequency) : null,
          duration:       payload.duration  ? sanitize(payload.duration)  : null,
          notes:          payload.notes     ? sanitize(payload.notes)     : null,
        })
        .select(PrescriptionService.BASE_SELECT)
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as unknown as Prescription, error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  static async listForAppointment(appointmentId: string): Promise<ServiceResult<Prescription[]>> {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(PrescriptionService.BASE_SELECT)
        .eq('appointment_id', appointmentId)
        .order('created_at', { ascending: false });

      if (error) return { data: null, error: error.message };
      return { data: data as unknown as Prescription[], error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  /** All prescriptions visible to the current user (RLS scopes by role). */
  static async listAll(): Promise<ServiceResult<Prescription[]>> {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(PrescriptionService.BASE_SELECT)
        .order('created_at', { ascending: false });

      if (error) return { data: null, error: error.message };
      return { data: data as unknown as Prescription[], error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }
}
