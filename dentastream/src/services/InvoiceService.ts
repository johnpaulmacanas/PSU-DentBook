import { supabase } from '../lib/supabase';
import { handleSupabaseError } from '../lib/errors';
import type { Invoice, InvoiceKind, ServiceResult } from '../types';

interface CreateInvoicePayload {
  appointment_id: string;
  kind?: InvoiceKind;   // defaults to 'initial'
  amount: number;
}

export class InvoiceService {
  private static readonly BASE_SELECT = `
    *,
    appointment:appointments(
      *,
      patient:patients(*, profile:profiles(*)),
      doctor:doctors(*, profile:profiles(*))
    )
  `;

  static async create(payload: CreateInvoicePayload): Promise<ServiceResult<Invoice>> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          appointment_id: payload.appointment_id,
          kind:           payload.kind ?? 'initial',
          amount:         Number.isFinite(payload.amount) ? payload.amount : 0,
        })
        .select(InvoiceService.BASE_SELECT)
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as unknown as Invoice, error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  static async listForAppointment(appointmentId: string): Promise<ServiceResult<Invoice[]>> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(InvoiceService.BASE_SELECT)
        .eq('appointment_id', appointmentId)
        .order('created_at');

      if (error) return { data: null, error: error.message };
      return { data: data as unknown as Invoice[], error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  /** All invoices visible to the current user (RLS scopes by role). */
  static async listAll(): Promise<ServiceResult<Invoice[]>> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(InvoiceService.BASE_SELECT)
        .order('created_at', { ascending: false });

      if (error) return { data: null, error: error.message };
      return { data: data as unknown as Invoice[], error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  static async markPaid(id: string): Promise<ServiceResult<Invoice>> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', id)
        .select(InvoiceService.BASE_SELECT)
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as unknown as Invoice, error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  /** Adjust the amount on an unpaid invoice. */
  static async updateAmount(id: string, amount: number): Promise<ServiceResult<Invoice>> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .update({ amount: Number.isFinite(amount) ? amount : 0 })
        .eq('id', id)
        .select(InvoiceService.BASE_SELECT)
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as unknown as Invoice, error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }
}
