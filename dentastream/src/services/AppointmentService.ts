import { supabase } from '../lib/supabase';
import { sanitize } from '../lib/sanitize';
import { handleSupabaseError } from '../lib/errors';
import type { Appointment, AppointmentStatus, ServiceResult } from '../types';

interface CreateAppointmentPayload {
  patient_id: string;
  doctor_id: string;
  scheduled_at: string;   // ISO 8601
  procedure: string;
  room?: string;
  notes?: string;
}

export class AppointmentService {
  private static readonly BASE_SELECT = `
    *,
    patient:patients(*, profile:profiles(*)),
    doctor:doctors(*, profile:profiles(*))
  `;

  static async create(payload: CreateAppointmentPayload): Promise<ServiceResult<Appointment>> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          patient_id:   payload.patient_id,
          doctor_id:    payload.doctor_id,
          scheduled_at: payload.scheduled_at,
          procedure:    sanitize(payload.procedure),
          room:         payload.room  ? sanitize(payload.room)  : null,
          notes:        payload.notes ? sanitize(payload.notes) : null,
        })
        .select(AppointmentService.BASE_SELECT)
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as unknown as Appointment, error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  static async listAll(filters?: {
    status?: AppointmentStatus;
    date?: string;
  }): Promise<ServiceResult<Appointment[]>> {
    try {
      let query = supabase
        .from('appointments')
        .select(AppointmentService.BASE_SELECT)
        .order('scheduled_at');

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.date) {
        const dayStart = `${filters.date}T00:00:00`;
        const dayEnd   = `${filters.date}T23:59:59`;
        query = query.gte('scheduled_at', dayStart).lte('scheduled_at', dayEnd);
      }

      const { data, error } = await query;
      if (error) return { data: null, error: error.message };
      return { data: data as unknown as Appointment[], error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  static async listForPatient(patientId: string): Promise<ServiceResult<Appointment[]>> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(AppointmentService.BASE_SELECT)
        .eq('patient_id', patientId)
        .order('scheduled_at', { ascending: false });

      if (error) return { data: null, error: error.message };
      return { data: data as unknown as Appointment[], error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  static async listForDoctor(doctorId: string): Promise<ServiceResult<Appointment[]>> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(AppointmentService.BASE_SELECT)
        .eq('doctor_id', doctorId)
        .order('scheduled_at');

      if (error) return { data: null, error: error.message };
      return { data: data as unknown as Appointment[], error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  static async updateStatus(
    id: string,
    status: AppointmentStatus
  ): Promise<ServiceResult<Appointment>> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id)
        .select(AppointmentService.BASE_SELECT)
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as unknown as Appointment, error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  static async delete(id: string): Promise<ServiceResult<boolean>> {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) return { data: null, error: error.message };
      return { data: true, error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }
}
