import { supabase } from '../lib/supabase';
import { handleSupabaseError } from '../lib/errors';
import type { ServiceResult } from '../types';

interface CheckoutResult {
  checkout_url: string;
  session_id: string;
}

interface PayPalOrderResult {
  order_id: string;
}

/**
 * Client-side payment service. Calls Supabase Edge Functions that securely
 * interact with PayMongo and PayPal APIs using server-held secret keys.
 */
export class PaymentService {
  /**
   * Create a PayMongo Checkout Session (QRPh + GCash + Card).
   * Returns the hosted checkout URL to redirect the patient to.
   */
  static async createPayMongoCheckout(
    invoiceId: string,
    amount: number,
    description?: string,
  ): Promise<ServiceResult<CheckoutResult>> {
    try {
      const { data, error } = await supabase.functions.invoke('create-paymongo-checkout', {
        body: {
          invoice_id: invoiceId,
          amount,
          description: description ?? 'Dental Service',
        },
      });

      if (error) return { data: null, error: error.message };
      if (data?.error) return { data: null, error: data.error };
      return { data: data as CheckoutResult, error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  /**
   * Create a PayPal order. Returns the order ID for the PayPal Buttons component.
   */
  static async createPayPalOrder(
    invoiceId: string,
    amount: number,
    description?: string,
  ): Promise<ServiceResult<PayPalOrderResult>> {
    try {
      const { data, error } = await supabase.functions.invoke('create-paypal-order', {
        body: {
          invoice_id: invoiceId,
          amount,
          description: description ?? 'Dental Service',
        },
      });

      if (error) return { data: null, error: error.message };
      if (data?.error) return { data: null, error: data.error };
      return { data: data as PayPalOrderResult, error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  /**
   * Capture an approved PayPal order (called from onApprove callback).
   */
  static async capturePayPalOrder(
    orderId: string,
    invoiceId: string,
  ): Promise<ServiceResult<{ success: boolean }>> {
    try {
      const { data, error } = await supabase.functions.invoke('capture-paypal-order', {
        body: { order_id: orderId, invoice_id: invoiceId },
      });

      if (error) return { data: null, error: error.message };
      if (data?.error) return { data: null, error: data.error };
      return { data: { success: true }, error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }
}
