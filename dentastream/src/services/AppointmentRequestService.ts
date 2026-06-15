import { supabase } from '../lib/supabase';
import { sanitize } from '../lib/sanitize';
import { handleSupabaseError } from '../lib/errors';
import { PatientService } from './PatientService';
import { AppointmentService } from './AppointmentService';
import { InvoiceService } from './InvoiceService';
import { concernLabel } from '../lib/format';
import type { Appointment, AppointmentRequest, Concern, ServiceResult } from '../types';

interface CreateRequestPayload {
  patient_profile_id: string;
  concern: Concern;
  preferred_doctor_id?: string | null;
  notes?: string;
  emergency_contact_name?: string;
  emergency_contact_relation?: string;
  emergency_contact_number?: string;
  allergies?: string;
  medications?: string;
  conditions?: string;
  is_pregnant?: boolean;
  consent: boolean;
  estimated_amount?: number;
}

interface ApproveRequestPayload {
  scheduled_at: string;          // ISO 8601 (admin-assigned date/time)
  doctor_id?: string | null;     // admin may override the preferred doctor
  room?: string;
  initial_amount?: number;       // initial invoice amount (defaults to 0)
}

export class AppointmentRequestService {
  private static readonly BASE_SELECT = `
    *,
    patient_profile:profiles(*),
    preferred_doctor:doctors(*, profile:profiles(*))
  `;

  /** sanitize() that preserves null/undefined for optional fields. */
  private static clean(value: string | undefined): string | null {
    return value ? sanitize(value) : null;
  }

  /** Patient submits an intake/booking request. Requires data-privacy consent. */
  static async create(payload: CreateRequestPayload): Promise<ServiceResult<AppointmentRequest>> {
    if (!payload.consent) {
      return { data: null, error: 'Data privacy consent is required to submit a request.' };
    }
    try {
      const { data, error } = await supabase
        .from('appointment_requests')
        .insert({
          patient_profile_id:         payload.patient_profile_id,
          concern:                    payload.concern,
          preferred_doctor_id:        payload.preferred_doctor_id ?? null,
          notes:                      AppointmentRequestService.clean(payload.notes),
          emergency_contact_name:     AppointmentRequestService.clean(payload.emergency_contact_name),
          emergency_contact_relation: AppointmentRequestService.clean(payload.emergency_contact_relation),
          emergency_contact_number:   AppointmentRequestService.clean(payload.emergency_contact_number),
          allergies:                  AppointmentRequestService.clean(payload.allergies),
          medications:                AppointmentRequestService.clean(payload.medications),
          conditions:                 AppointmentRequestService.clean(payload.conditions),
          is_pregnant:                payload.is_pregnant ?? false,
          consent:                    payload.consent,
          estimated_amount:           payload.estimated_amount ?? 0,
        })
        .select(AppointmentRequestService.BASE_SELECT)
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as unknown as AppointmentRequest, error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  /** A patient's own requests (RLS also enforces this). */
  static async listMine(profileId: string): Promise<ServiceResult<AppointmentRequest[]>> {
    try {
      const { data, error } = await supabase
        .from('appointment_requests')
        .select(AppointmentRequestService.BASE_SELECT)
        .eq('patient_profile_id', profileId)
        .order('created_at', { ascending: false });

      if (error) return { data: null, error: error.message };
      return { data: data as unknown as AppointmentRequest[], error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  /** Pending requests for the admin approval queue. */
  static async listPending(): Promise<ServiceResult<AppointmentRequest[]>> {
    try {
      const { data, error } = await supabase
        .from('appointment_requests')
        .select(AppointmentRequestService.BASE_SELECT)
        .eq('request_status', 'pending')
        .order('created_at');

      if (error) return { data: null, error: error.message };
      return { data: data as unknown as AppointmentRequest[], error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  /**
   * Approve a request: resolve/create the patient's clinical row, create a
   * scheduled appointment linked to the request, create the initial invoice,
   * then mark the request approved. Returns the new appointment.
   *
   * Note: this is a multi-step sequence, not a DB transaction (the JS client
   * cannot wrap RLS-protected inserts in one). Steps are ordered so a failure
   * surfaces before the request is flipped to 'approved'.
   */
  static async approve(
    requestId: string,
    payload: ApproveRequestPayload
  ): Promise<ServiceResult<Appointment>> {
    try {
      // 1. Load the request.
      const { data: reqRow, error: reqErr } = await supabase
        .from('appointment_requests')
        .select('*')
        .eq('id', requestId)
        .single();
      if (reqErr) return { data: null, error: reqErr.message };
      const request = reqRow as AppointmentRequest;

      // 2. Resolve/create the patient clinical row.
      const patient = await PatientService.getOrCreateByProfile(request.patient_profile_id);
      if (patient.error || !patient.data) {
        return { data: null, error: patient.error ?? 'Could not resolve patient record.' };
      }

      // 3. Create the scheduled appointment (procedure derived from the concern).
      const appt = await AppointmentService.create({
        patient_id:   patient.data.id,
        doctor_id:    payload.doctor_id ?? request.preferred_doctor_id ?? null,
        scheduled_at: payload.scheduled_at,
        procedure:    concernLabel(request.concern),
        room:         payload.room,
        notes:        request.notes ?? undefined,
        status:       'scheduled',
        request_id:   request.id,
      });
      if (appt.error || !appt.data) {
        return { data: null, error: appt.error ?? 'Could not create appointment.' };
      }

      // 4. Create the initial invoice. Defaults to the patient-facing estimate
      //    captured at request time, unless the admin overrides it on approval.
      const invoice = await InvoiceService.create({
        appointment_id: appt.data.id,
        kind: 'initial',
        amount: payload.initial_amount ?? request.estimated_amount ?? 0,
      });
      if (invoice.error) {
        // The appointment exists; report the invoice failure but don't roll back.
        return { data: null, error: `Appointment created, but invoice failed: ${invoice.error}` };
      }

      // 5. Flip the request to approved.
      const { error: updErr } = await supabase
        .from('appointment_requests')
        .update({ request_status: 'approved' })
        .eq('id', requestId);
      if (updErr) return { data: null, error: updErr.message };

      return { data: appt.data, error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  static async decline(requestId: string): Promise<ServiceResult<boolean>> {
    try {
      const { error } = await supabase
        .from('appointment_requests')
        .update({ request_status: 'declined' })
        .eq('id', requestId);

      if (error) return { data: null, error: error.message };
      return { data: true, error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }
}
