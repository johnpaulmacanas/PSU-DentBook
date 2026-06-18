// supabase/functions/paymongo-webhook/index.ts
// Receives PayMongo webhook events and marks invoices as paid.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req) => {
  // Webhooks are always POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await req.json();
    const eventType = body?.data?.attributes?.type;
    const eventData = body?.data?.attributes?.data;

    console.log('Webhook event:', eventType);

    if (eventType === 'checkout_session.payment.paid') {
      const referenceNumber = eventData?.attributes?.reference_number;
      const sessionId = eventData?.id;

      if (!referenceNumber) {
        console.warn('No reference_number in webhook event');
        return new Response('ok', { status: 200 });
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

      // Update payment_transactions
      await supabase
        .from('payment_transactions')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('gateway_session_id', sessionId);

      // Mark the invoice as paid
      await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', referenceNumber);

      // Create a receipt
      const receiptNo = `R-${Date.now().toString(36).toUpperCase()}`;
      await supabase
        .from('receipts')
        .insert({ invoice_id: referenceNumber, receipt_no: receiptNo });

      console.log(`Invoice ${referenceNumber} marked as paid via PayMongo`);
    }

    return new Response('ok', { status: 200 });
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response('Internal error', { status: 500 });
  }
});
