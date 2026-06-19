// supabase/functions/create-paymongo-checkout/index.ts
// Creates a PayMongo Checkout Session with QRPh enabled.
// Called by the frontend via supabase.functions.invoke().

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PAYMONGO_SECRET = Deno.env.get('PAYMONGO_SECRET_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { invoice_id, amount, description, success_url, cancel_url } = await req.json();

    if (!invoice_id || !amount) {
      return new Response(
        JSON.stringify({ error: 'invoice_id and amount are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Amount is in centavos (PHP), e.g. 50000 = ₱500.00
    const amountCentavos = Math.round(amount * 100);

    const paymongoRes = await fetch('https://api.paymongo.com/v2/checkout_sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${PAYMONGO_SECRET}:`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            line_items: [
              {
                name: description || 'Dental Service',
                amount: amountCentavos,
                currency: 'PHP',
                quantity: 1,
              },
            ],
            payment_method_types: ['qrph', 'gcash', 'card'],
            success_url: success_url || `${req.headers.get('origin')}/patient/billing?payment=success`,
            cancel_url: cancel_url || `${req.headers.get('origin')}/patient/billing?payment=cancelled`,
            reference_number: invoice_id,
            description: description || 'DentaStream Dental Service',
          },
        },
      }),
    });

    const paymongoData = await paymongoRes.json();

    if (!paymongoRes.ok) {
      console.error('PayMongo error:', JSON.stringify(paymongoData));
      return new Response(
        JSON.stringify({ error: paymongoData.errors?.[0]?.detail ?? 'PayMongo API error' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const checkoutUrl = paymongoData.data.attributes.checkout_url;
    const sessionId = paymongoData.data.id;

    // Record the payment attempt in Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    await supabase.from('payment_transactions').insert({
      invoice_id,
      gateway: 'paymongo',
      gateway_session_id: sessionId,
      amount,
      status: 'pending',
    });

    return new Response(
      JSON.stringify({ checkout_url: checkoutUrl, session_id: sessionId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
