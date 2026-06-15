import { supabase } from '../lib/supabase';
import { handleSupabaseError } from '../lib/errors';
import { InvoiceService } from './InvoiceService';
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

  /** Generates a unique-ish receipt number. Not user-supplied, so no sanitize. */
  private static nextReceiptNo(): string {
    return `R-${Date.now().toString(36).toUpperCase()}`;
  }

  /**
   * Issue a receipt for an invoice and mark that invoice paid.
   * Returns the created receipt.
   */
  static async issue(invoiceId: string): Promise<ServiceResult<Receipt>> {
    try {
      const { data, error } = await supabase
        .from('receipts')
        .insert({ invoice_id: invoiceId, receipt_no: ReceiptService.nextReceiptNo() })
        .select(ReceiptService.BASE_SELECT)
        .single();

      if (error) return { data: null, error: error.message };

      // Settle the invoice now that a receipt exists. Non-fatal if it fails;
      // the receipt is still valid, so we surface the receipt regardless.
      await InvoiceService.markPaid(invoiceId);

      return { data: data as unknown as Receipt, error: null };
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
