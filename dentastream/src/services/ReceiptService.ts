import { supabase } from '../lib/supabase';
import { handleSupabaseError } from '../lib/errors';
import type { Receipt, ServiceResult } from '../types';

export class ReceiptService {
  private static readonly BASE_SELECT = `
    *,
    invoice:invoices(
      *,
      appointment:appointments(
        *,
        patient:patients(*, profile:profiles(*))
      )
    )
  `;

  /**
   * Issue a receipt for an invoice and mark that invoice paid in one
   * atomic step via the pay_invoice RPC. The RPC is SECURITY DEFINER so
   * patients can settle their own invoices without RLS on receipts/invoices
   * needing to be loosened.
   */
  static async issue(invoiceId: string): Promise<ServiceResult<Receipt>> {
    try {
      const { data, error } = await supabase
        .rpc('pay_invoice', { p_invoice_id: invoiceId })
        .single<{ receipt_id: string; receipt_no: string }>();

      if (error) return { data: null, error: error.message };
      if (!data) return { data: null, error: 'Payment failed' };

      return {
        data: { id: data.receipt_id, receipt_no: data.receipt_no } as Receipt,
        error: null,
      };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  static async listForInvoice(invoiceId: string): Promise<ServiceResult<Receipt[]>> {
    try {
      const { data, error } = await supabase
        .from('receipts')
        .select(ReceiptService.BASE_SELECT)
        .eq('invoice_id', invoiceId)
        .order('issued_at', { ascending: false });

      if (error) return { data: null, error: error.message };
      return { data: data as unknown as Receipt[], error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  /** All receipts visible to the current user (RLS scopes by role). */
  static async listAll(): Promise<ServiceResult<Receipt[]>> {
    try {
      const { data, error } = await supabase
        .from('receipts')
        .select(ReceiptService.BASE_SELECT)
        .order('issued_at', { ascending: false });

      if (error) return { data: null, error: error.message };
      return { data: data as unknown as Receipt[], error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }
}
