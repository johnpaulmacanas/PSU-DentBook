import { supabase } from '../lib/supabase';
import { sanitize } from '../lib/sanitize';
import { handleSupabaseError } from '../lib/errors';
import type { Appointment, AppointmentStatus, ServiceResult } from '../types';

interface CreateAppointmentPayload {
  patient_id: string;
  doctor_id?: string | null;   // optional dentist
  scheduled_at: string;        // ISO 8601
  procedure: string;
  room?: string;
  notes?: string;
  status?: AppointmentStatus;  // defaults to DB default ('pending') when omitted
  request_id?: string | null;  // links back to an approved appointment_request
}

/** Sort keys for the doctor schedule view. */
export type AppointmentSort = 'date' | 'service' | 'status';

export class AppointmentService {
  private static readonly BASE_SELECT = `
    *,
    patient:patients(*, profile:profiles(*)),
    doctor:doctors(*, profile:profiles(*))
  `;

  /** Maps a UI sort key to a real column. Never interpolates user input. */
  private static sortColumn(sort: AppointmentSort): string {
    switch (sort) {
      case 'service': return 'procedure';
      case 'status':  return 'status';
      case 'date':
      default:        return 'scheduled_at';
    }
  }

  static async create(payload: CreateAppointmentPayload): Promise<ServiceResult<Appointment>> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          patient_id:   payload.patient_id,
          doctor_id:    payload.doctor_id ?? null,
          scheduled_at: payload.scheduled_at,
          procedure:    sanitize(payload.procedure),
          room:         payload.room  ? sanitize(payload.room)  : null,
          notes:        payload.notes ? sanitize(payload.notes) : null,
          ...(payload.status ? { status: payload.status } : {}),
          ...(payload.request_id ? { request_id: payload.request_id } : {}),
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

  static async listForDoctor(
    doctorId: string,
    sortBy: AppointmentSort = 'date'
  ): Promise<ServiceResult<Appointment[]>> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(AppointmentService.BASE_SELECT)
        .eq('doctor_id', doctorId)
        .order(AppointmentService.sortColumn(sortBy));

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

  /** Set date/time (and optionally doctor/room) and move to 'scheduled'. */
  static async schedule(
    id: string,
    updates: { scheduled_at: string; doctor_id?: string | null; room?: string }
  ): Promise<ServiceResult<Appointment>> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({
          scheduled_at: updates.scheduled_at,
          status: 'scheduled' as AppointmentStatus,
          ...(updates.doctor_id !== undefined ? { doctor_id: updates.doctor_id } : {}),
          ...(updates.room !== undefined ? { room: sanitize(updates.room) } : {}),
        })
        .eq('id', id)
        .select(AppointmentService.BASE_SELECT)
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as unknown as Appointment, error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  /** Move an appointment to a new time and mark it 'rescheduled'. */
  static async reschedule(id: string, scheduledAt: string): Promise<ServiceResult<Appointment>> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({ scheduled_at: scheduledAt, status: 'rescheduled' as AppointmentStatus })
        .eq('id', id)
        .select(AppointmentService.BASE_SELECT)
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as unknown as Appointment, error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  /** General-purpose patch: update editable fields on an appointment. */
  static async update(
    id: string,
    fields: Partial<Pick<Appointment, 'doctor_id' | 'room' | 'notes' | 'visit_notes' | 'procedure'>>
  ): Promise<ServiceResult<Appointment>> {
    try {
      const patch: Record<string, unknown> = {};
      if (fields.doctor_id !== undefined) patch.doctor_id = fields.doctor_id;
      if (fields.room !== undefined) patch.room = fields.room ? sanitize(fields.room) : null;
      if (fields.notes !== undefined) patch.notes = fields.notes ? sanitize(fields.notes) : null;
      if (fields.visit_notes !== undefined) patch.visit_notes = fields.visit_notes ? sanitize(fields.visit_notes) : null;
      if (fields.procedure !== undefined) patch.procedure = sanitize(fields.procedure);

      const { data, error } = await supabase
        .from('appointments')
        .update(patch)
        .eq('id', id)
        .select(AppointmentService.BASE_SELECT)
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as unknown as Appointment, error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  /** Convenience wrapper: mark as missed (no-show). */
  static markMissed(id: string): Promise<ServiceResult<Appointment>> {
    return AppointmentService.updateStatus(id, 'missed');
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
