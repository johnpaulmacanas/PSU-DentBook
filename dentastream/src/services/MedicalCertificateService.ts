import { supabase } from '../lib/supabase';
import { sanitize } from '../lib/sanitize';
import { handleSupabaseError } from '../lib/errors';
import type { MedicalCertificate, ServiceResult } from '../types';

interface IssueCertificatePayload {
  appointment_id: string;
  issued_by: string;          // doctor profile id
  diagnosis?: string;
  recommendation?: string;
  valid_from?: string;        // yyyy-mm-dd
  valid_to?: string;          // yyyy-mm-dd
}

export class MedicalCertificateService {
  private static readonly BASE_SELECT = `
    *,
    appointment:appointments(
      *,
      patient:patients(*, profile:profiles(*)),
      doctor:doctors(*, profile:profiles(*))
    )
  `;

  static async issue(payload: IssueCertificatePayload): Promise<ServiceResult<MedicalCertificate>> {
    try {
      const { data, error } = await supabase
        .from('medical_certificates')
        .insert({
          appointment_id: payload.appointment_id,
          issued_by:      payload.issued_by,
          diagnosis:      payload.diagnosis      ? sanitize(payload.diagnosis)      : null,
          recommendation: payload.recommendation ? sanitize(payload.recommendation) : null,
          valid_from:     payload.valid_from ?? null,
          valid_to:       payload.valid_to ?? null,
        })
        .select(MedicalCertificateService.BASE_SELECT)
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as unknown as MedicalCertificate, error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  static async listForAppointment(appointmentId: string): Promise<ServiceResult<MedicalCertificate[]>> {
    try {
      const { data, error } = await supabase
        .from('medical_certificates')
        .select(MedicalCertificateService.BASE_SELECT)
        .eq('appointment_id', appointmentId)
        .order('issued_at', { ascending: false });

      if (error) return { data: null, error: error.message };
      return { data: data as unknown as MedicalCertificate[], error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  /** All certificates visible to the current user (RLS scopes by role). */
  static async listAll(): Promise<ServiceResult<MedicalCertificate[]>> {
    try {
      const { data, error } = await supabase
        .from('medical_certificates')
        .select(MedicalCertificateService.BASE_SELECT)
        .order('issued_at', { ascending: false });

      if (error) return { data: null, error: error.message };
      return { data: data as unknown as MedicalCertificate[], error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }
}
