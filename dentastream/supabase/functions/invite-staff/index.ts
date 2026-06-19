// supabase/functions/invite-staff/index.ts
// Creates a new auth user with a specified role (doctor/admin) and profile.
// Requires the service_role key — cannot be done from the anon client.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, password, full_name, role, specialty } = await req.json();

    // Validate inputs
    if (!email || !password || !full_name || !role) {
      return new Response(
        JSON.stringify({ error: 'email, password, full_name, and role are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!['doctor', 'admin', 'patient'].includes(role)) {
      return new Response(
        JSON.stringify({ error: 'role must be "doctor", "admin", or "patient"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Verify the caller is an admin
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const callerToken = authHeader.replace('Bearer ', '');
    const supabaseAnon = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY') ?? '');
    const { data: { user: caller } } = await supabaseAnon.auth.getUser(callerToken);

    if (!caller) {
      return new Response(
        JSON.stringify({ error: 'Invalid auth token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Check caller is admin via profiles table
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single();

    if (callerProfile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Only admins can invite staff' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 1. Create the auth user using service_role
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm so they can log in immediately
      user_metadata: { full_name, role },
    });

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const userId = newUser.user.id;

    // 2. Create the profile (the signup trigger may already do this,
    //    but upsert to be safe and ensure role is set correctly)
    await supabase.from('profiles').upsert({
      id: userId,
      full_name,
      role,
    }, { onConflict: 'id' });

    // 3. If role is doctor, also create the doctors row
    if (role === 'doctor') {
      await supabase.from('doctors').insert({
        profile_id: userId,
        specialty: specialty?.trim() || null,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        email,
        role,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('invite-staff error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
