import { supabase } from '../lib/supabase';
import { sanitize } from '../lib/sanitize';
import { handleSupabaseError } from '../lib/errors';
import type { TreatmentResult, ServiceResult } from '../types';

interface CreateTreatmentResultPayload {
  appointment_id: string;
  recorded_by: string;            // doctor profile id
  procedure_performed: string;
  findings?: string;
  outcome?: string;
  notes?: string;
}

export class TreatmentResultService {
  private static readonly BASE_SELECT = `
    *,
    appointment:appointments(
      *,
      patient:patients(*, profile:profiles(*)),
      doctor:doctors(*, profile:profiles(*))
    )
  `;

  static async create(payload: CreateTreatmentResultPayload): Promise<ServiceResult<TreatmentResult>> {
    try {
      const { data, error } = await supabase
        .from('treatment_results')
        .insert({
          appointment_id:     payload.appointment_id,
          recorded_by:        payload.recorded_by,
          procedure_performed: sanitize(payload.procedure_performed),
          findings:           payload.findings ? sanitize(payload.findings) : null,
          outcome:            payload.outcome  ? sanitize(payload.outcome)  : null,
          notes:              payload.notes    ? sanitize(payload.notes)    : null,
        })
        .select(TreatmentResultService.BASE_SELECT)
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as unknown as TreatmentResult, error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  static async listForAppointment(appointmentId: string): Promise<ServiceResult<TreatmentResult[]>> {
    try {
      const { data, error } = await supabase
        .from('treatment_results')
        .select(TreatmentResultService.BASE_SELECT)
        .eq('appointment_id', appointmentId)
        .order('created_at', { ascending: false });

      if (error) return { data: null, error: error.message };
      return { data: data as unknown as TreatmentResult[], error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  /** All results visible to the current user (RLS scopes by role). */
  static async listAll(): Promise<ServiceResult<TreatmentResult[]>> {
    try {
      const { data, error } = await supabase
        .from('treatment_results')
        .select(TreatmentResultService.BASE_SELECT)
        .order('created_at', { ascending: false });

      if (error) return { data: null, error: error.message };
      return { data: data as unknown as TreatmentResult[], error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }
}
