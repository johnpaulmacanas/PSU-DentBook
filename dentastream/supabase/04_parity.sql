-- ============================================================
-- DentaStream — Full-parity migration (Phase 2)
--
-- Run order:
--   schema.sql → 02_workflow.sql → 03_fix_rls_recursion.sql → 04_parity.sql
--
-- Adds:
--   • prescriptions table        — doctor writes Rx for a visit
--   • treatment_results table    — doctor records clinical findings
--   • clinic_settings table      — key-value config (admin manages)
--   • appointments.visit_notes   — free-text clinical notes per visit
--
-- RLS follows the same SECURITY DEFINER helper pattern from 03_fix_rls_recursion.sql
-- to avoid recursive policy checks.
--
-- Safe to re-run: all statements are idempotent.
-- ============================================================

-- ============================================================
-- 1. VISIT NOTES on appointments
-- ============================================================
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS visit_notes TEXT;

-- ============================================================
-- 2. PRESCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS prescriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id  UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  medication      TEXT NOT NULL,
  dosage          TEXT,
  frequency       TEXT,
  duration        TEXT,
  notes           TEXT,
  prescribed_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_appointment ON prescriptions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_prescriber  ON prescriptions(prescribed_by);

-- ============================================================
-- 3. TREATMENT RESULTS
-- ============================================================
CREATE TABLE IF NOT EXISTS treatment_results (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id       UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  procedure_performed  TEXT NOT NULL,
  findings             TEXT,
  outcome              TEXT,
  notes                TEXT,
  recorded_by          UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_results_appointment ON treatment_results(appointment_id);
CREATE INDEX IF NOT EXISTS idx_results_recorder    ON treatment_results(recorded_by);

-- ============================================================
-- 4. CLINIC SETTINGS (key-value store)
-- ============================================================
CREATE TABLE IF NOT EXISTS clinic_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed defaults (no-op if already exist)
INSERT INTO clinic_settings (key, value) VALUES
  ('clinic_name',           'DentaStream Dental Clinic'),
  ('open_time',             '08:00'),
  ('close_time',            '18:00'),
  ('slot_duration_minutes', '30')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE prescriptions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_results   ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_settings     ENABLE ROW LEVEL SECURITY;

-- ---- PRESCRIPTIONS ----
-- SELECT: admin + patient on appointment + doctor on appointment
DROP POLICY IF EXISTS "prescriptions_select" ON prescriptions;
CREATE POLICY "prescriptions_select" ON prescriptions FOR SELECT
  USING (
    current_user_role() = 'admin'
    OR is_patient_on_appointment(appointment_id)
    OR is_doctor_on_appointment(appointment_id)
  );

-- INSERT: doctor or admin
DROP POLICY IF EXISTS "prescriptions_insert" ON prescriptions;
CREATE POLICY "prescriptions_insert" ON prescriptions FOR INSERT
  WITH CHECK (current_user_role() IN ('admin', 'doctor'));

-- UPDATE: doctor or admin
DROP POLICY IF EXISTS "prescriptions_update" ON prescriptions;
CREATE POLICY "prescriptions_update" ON prescriptions FOR UPDATE
  USING (current_user_role() IN ('admin', 'doctor'));

-- ---- TREATMENT RESULTS ----
-- SELECT: admin + patient on appointment + doctor on appointment
DROP POLICY IF EXISTS "results_select" ON treatment_results;
CREATE POLICY "results_select" ON treatment_results FOR SELECT
  USING (
    current_user_role() = 'admin'
    OR is_patient_on_appointment(appointment_id)
    OR is_doctor_on_appointment(appointment_id)
  );

-- INSERT: doctor or admin
DROP POLICY IF EXISTS "results_insert" ON treatment_results;
CREATE POLICY "results_insert" ON treatment_results FOR INSERT
  WITH CHECK (current_user_role() IN ('admin', 'doctor'));

-- UPDATE: doctor or admin
DROP POLICY IF EXISTS "results_update" ON treatment_results;
CREATE POLICY "results_update" ON treatment_results FOR UPDATE
  USING (current_user_role() IN ('admin', 'doctor'));

-- ---- CLINIC SETTINGS ----
-- SELECT: all authenticated users can read
DROP POLICY IF EXISTS "settings_select" ON clinic_settings;
CREATE POLICY "settings_select" ON clinic_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- INSERT: admin only
DROP POLICY IF EXISTS "settings_insert" ON clinic_settings;
CREATE POLICY "settings_insert" ON clinic_settings FOR INSERT
  WITH CHECK (current_user_role() = 'admin');

-- UPDATE: admin only
DROP POLICY IF EXISTS "settings_update" ON clinic_settings;
CREATE POLICY "settings_update" ON clinic_settings FOR UPDATE
  USING (current_user_role() = 'admin');

-- ============================================================
-- 6. REALTIME
-- ============================================================
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE prescriptions;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE treatment_results;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 7. ALLOW REQUEST CANCELLATION BY PATIENT
--    The 02_workflow.sql only allows admin to update requests.
--    Patients need to cancel their own pending requests.
-- ============================================================
DROP POLICY IF EXISTS "requests_update" ON appointment_requests;
CREATE POLICY "requests_update" ON appointment_requests FOR UPDATE
  USING (
    current_user_role() = 'admin'
    OR (patient_profile_id = auth.uid() AND request_status = 'pending')
  );
