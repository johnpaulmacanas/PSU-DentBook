-- ============================================================
-- DentaStream — Supabase schema, RLS, triggers
-- Run this in the Supabase Dashboard → SQL Editor.
--
-- Safe to re-run: drops are guarded with IF EXISTS / IF NOT EXISTS
-- where Postgres allows it. Enums and policies are created idempotently.
--
-- NOTE (auth): a SECURITY DEFINER trigger on auth.users auto-creates the
-- matching profiles row from the signup metadata (full_name, role, contact).
-- The client therefore does NOT insert into profiles directly.
-- For quick local testing, disable "Confirm email" under Auth settings so
-- sign-up produces a session immediately.
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'patient');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE gender_type AS ENUM ('M', 'F', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role         user_role NOT NULL DEFAULT 'patient',
  full_name    TEXT NOT NULL,
  contact      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PATIENTS (extra clinical data for patient-role users)
-- ============================================================
CREATE TABLE IF NOT EXISTS patients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  patient_code  TEXT UNIQUE NOT NULL,  -- e.g. 'P-001'
  age           INT,
  gender        gender_type,
  medical_notes TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DOCTORS (extra data for doctor-role users)
-- ============================================================
CREATE TABLE IF NOT EXISTS doctors (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  specialty    TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- APPOINTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id    UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  procedure    TEXT NOT NULL,
  status       appointment_status NOT NULL DEFAULT 'scheduled',
  room         TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CHAT CHANNELS
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_channels (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  description  TEXT,
  created_by   UUID REFERENCES profiles(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CHANNEL MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS channel_members (
  channel_id   UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  profile_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (channel_id, profile_id)
);

-- ============================================================
-- CHAT MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id   UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  sender_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content      TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  is_deleted   BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_appointments_patient   ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor    ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status    ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date      ON appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel  ON chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created  ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_role          ON profiles(role);

-- ============================================================
-- UPDATED_AT TRIGGER (reusable)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_appointments_updated ON appointments;
CREATE TRIGGER trg_appointments_updated
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_updated ON profiles;
CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- Replaces a client-side profiles INSERT (which RLS would block and which
-- would have no session under email confirmation). Runs as SECURITY DEFINER
-- so it can write to profiles regardless of the caller's RLS context.
-- ============================================================
-- SET search_path is REQUIRED here. This trigger fires as the supabase_auth_admin
-- role during signup, and that role's search_path does NOT include "public".
-- Without the SET, the references to "profiles" and the "::user_role" cast cannot
-- be resolved, the function raises, the INSERT into auth.users rolls back, and the
-- client sees: "Database error creating new user".
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO profiles (id, role, full_name, contact)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'patient'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'contact'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients         ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors          ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channels    ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages    ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's role (avoids repeated sub-selects)
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- ---- PROFILES ----
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (id = auth.uid() OR current_user_role() = 'admin');

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  USING (id = auth.uid());

-- ---- PATIENTS ----  own record + admins + assigned doctor
DROP POLICY IF EXISTS "patients_select" ON patients;
CREATE POLICY "patients_select" ON patients FOR SELECT
  USING (
    profile_id = auth.uid()
    OR current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM appointments a
      JOIN doctors d ON d.id = a.doctor_id
      WHERE a.patient_id = patients.id
        AND d.profile_id = auth.uid()
    )
  );

-- ---- APPOINTMENTS ----  patient sees own; doctor sees theirs; admin sees all
DROP POLICY IF EXISTS "appointments_select" ON appointments;
CREATE POLICY "appointments_select" ON appointments FOR SELECT
  USING (
    current_user_role() = 'admin'
    OR EXISTS (SELECT 1 FROM patients p WHERE p.id = patient_id AND p.profile_id = auth.uid())
    OR EXISTS (SELECT 1 FROM doctors  d WHERE d.id = doctor_id  AND d.profile_id = auth.uid())
  );

DROP POLICY IF EXISTS "appointments_insert" ON appointments;
CREATE POLICY "appointments_insert" ON appointments FOR INSERT
  WITH CHECK (current_user_role() IN ('admin', 'doctor'));

DROP POLICY IF EXISTS "appointments_update" ON appointments;
CREATE POLICY "appointments_update" ON appointments FOR UPDATE
  USING (current_user_role() IN ('admin', 'doctor'));

-- ---- CHAT CHANNELS ----  members can see their channels; admin manages
DROP POLICY IF EXISTS "chat_channels_select" ON chat_channels;
CREATE POLICY "chat_channels_select" ON chat_channels FOR SELECT
  USING (
    current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM channel_members cm
      WHERE cm.channel_id = chat_channels.id
        AND cm.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "chat_channels_insert" ON chat_channels;
CREATE POLICY "chat_channels_insert" ON chat_channels FOR INSERT
  WITH CHECK (current_user_role() = 'admin');

-- ---- CHANNEL MEMBERS ----  see own membership; admin manages
DROP POLICY IF EXISTS "channel_members_select" ON channel_members;
CREATE POLICY "channel_members_select" ON channel_members FOR SELECT
  USING (profile_id = auth.uid() OR current_user_role() = 'admin');

DROP POLICY IF EXISTS "channel_members_insert" ON channel_members;
CREATE POLICY "channel_members_insert" ON channel_members FOR INSERT
  WITH CHECK (current_user_role() = 'admin');

-- ---- CHAT MESSAGES ----
DROP POLICY IF EXISTS "chat_messages_select" ON chat_messages;
CREATE POLICY "chat_messages_select" ON chat_messages FOR SELECT
  USING (
    current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM channel_members cm
      WHERE cm.channel_id = chat_messages.channel_id
        AND cm.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "chat_messages_insert" ON chat_messages;
CREATE POLICY "chat_messages_insert" ON chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM channel_members cm
      WHERE cm.channel_id = channel_id
        AND cm.profile_id = auth.uid()
    )
  );

-- Soft-delete own messages (or admin)
DROP POLICY IF EXISTS "chat_messages_soft_delete" ON chat_messages;
CREATE POLICY "chat_messages_soft_delete" ON chat_messages FOR UPDATE
  USING (sender_id = auth.uid() OR current_user_role() = 'admin');

-- ============================================================
-- REALTIME
-- ============================================================
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- OPTIONAL SEED (uncomment & edit after you have created users)
-- Channels/members are admin-managed; the anon client cannot create them
-- without an admin session, so seed here once for testing.
-- ============================================================
-- INSERT INTO chat_channels (id, name, description)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'Front Desk', 'Clinic coordination');
--
-- -- Add every profile that should see the channel:
-- INSERT INTO channel_members (channel_id, profile_id)
-- SELECT '00000000-0000-0000-0000-000000000001', id FROM profiles;
