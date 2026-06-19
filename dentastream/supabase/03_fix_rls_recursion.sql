-- ============================================================
-- DentaStream — Fix RLS infinite recursion (Phase 0.1)
--
-- Run order:
--   schema.sql → 02_workflow.sql → 03_fix_rls_recursion.sql
--
-- Problem: patients_select → EXISTS on appointments → appointments_select
--          → EXISTS on patients → patients_select → ∞
--
-- Fix: Replace the recursive sub-selects with SECURITY DEFINER helper
--      functions that bypass RLS on the target table, breaking the cycle.
--      Also fixes downstream policies (invoices, receipts, certs) that
--      inherit the same recursion via JOINs through appointments+patients.
--
-- Safe to re-run: policies are dropped before recreating; functions use
--      CREATE OR REPLACE.
-- ============================================================

-- ============================================================
-- 1. SECURITY DEFINER HELPER FUNCTIONS
--    These run with the definer's privileges (bypassing RLS on the
--    tables they query) so the calling policy never triggers a
--    recursive RLS check.
-- ============================================================

-- Does the current user (as a doctor) have any appointment with
-- the given patient? Used by patients_select.
CREATE OR REPLACE FUNCTION is_treating_doctor(p_patient_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM appointments a
    JOIN doctors d ON d.id = a.doctor_id
    WHERE a.patient_id = p_patient_id
      AND d.profile_id = auth.uid()
  );
$$;

-- Is the current user the patient who owns the given patient_id row?
-- Used by appointments_select (and downstream: invoices, receipts, certs).
CREATE OR REPLACE FUNCTION is_own_patient(p_patient_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM patients p
    WHERE p.id = p_patient_id
      AND p.profile_id = auth.uid()
  );
$$;

-- Is the current user the doctor assigned to the given doctor_id?
-- Used by appointments_select.
CREATE OR REPLACE FUNCTION is_own_doctor(p_doctor_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM doctors d
    WHERE d.id = p_doctor_id
      AND d.profile_id = auth.uid()
  );
$$;

-- Is the current user the patient on an appointment?
-- Used by invoices/receipts/certs policies.
CREATE OR REPLACE FUNCTION is_patient_on_appointment(p_appointment_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM appointments a
    JOIN patients p ON p.id = a.patient_id
    WHERE a.id = p_appointment_id
      AND p.profile_id = auth.uid()
  );
$$;

-- Is the current user the doctor on an appointment?
-- Used by invoices/certs policies.
CREATE OR REPLACE FUNCTION is_doctor_on_appointment(p_appointment_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM appointments a
    JOIN doctors d ON d.id = a.doctor_id
    WHERE a.id = p_appointment_id
      AND d.profile_id = auth.uid()
  );
$$;

-- Is the current user the patient on an invoice (via appointment→patient)?
-- Used by receipts_select.
CREATE OR REPLACE FUNCTION is_patient_on_invoice(p_invoice_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM invoices i
    JOIN appointments a ON a.id = i.appointment_id
    JOIN patients p     ON p.id = a.patient_id
    WHERE i.id = p_invoice_id
      AND p.profile_id = auth.uid()
  );
$$;


-- ============================================================
-- 2. FIX PATIENTS POLICIES
-- ============================================================

-- SELECT: own record + admin + treating doctor (no more EXISTS on appointments)
DROP POLICY IF EXISTS "patients_select" ON patients;
CREATE POLICY "patients_select" ON patients FOR SELECT
  USING (
    profile_id = auth.uid()
    OR current_user_role() = 'admin'
    OR is_treating_doctor(patients.id)
  );

-- INSERT: (already exists from 02_workflow.sql, but re-state for completeness)
DROP POLICY IF EXISTS "patients_insert" ON patients;
CREATE POLICY "patients_insert" ON patients FOR INSERT
  WITH CHECK (profile_id = auth.uid() OR current_user_role() = 'admin');

-- UPDATE: admin only
DROP POLICY IF EXISTS "patients_update" ON patients;
CREATE POLICY "patients_update" ON patients FOR UPDATE
  USING (current_user_role() = 'admin');


-- ============================================================
-- 3. FIX APPOINTMENTS POLICIES
-- ============================================================

-- SELECT: admin + own-patient + own-doctor (no more EXISTS on patients/doctors)
DROP POLICY IF EXISTS "appointments_select" ON appointments;
CREATE POLICY "appointments_select" ON appointments FOR SELECT
  USING (
    current_user_role() = 'admin'
    OR is_own_patient(patient_id)
    OR is_own_doctor(doctor_id)
  );

-- INSERT: (unchanged)
DROP POLICY IF EXISTS "appointments_insert" ON appointments;
CREATE POLICY "appointments_insert" ON appointments FOR INSERT
  WITH CHECK (current_user_role() IN ('admin', 'doctor'));

-- UPDATE: (unchanged)
DROP POLICY IF EXISTS "appointments_update" ON appointments;
CREATE POLICY "appointments_update" ON appointments FOR UPDATE
  USING (current_user_role() IN ('admin', 'doctor'));

-- DELETE: admin only
DROP POLICY IF EXISTS "appointments_delete" ON appointments;
CREATE POLICY "appointments_delete" ON appointments FOR DELETE
  USING (current_user_role() = 'admin');


-- ============================================================
-- 4. ADD MISSING DOCTORS POLICIES
-- ============================================================

-- SELECT: all authenticated users (needed for intake form dropdown & embeds)
DROP POLICY IF EXISTS "doctors_select" ON doctors;
CREATE POLICY "doctors_select" ON doctors FOR SELECT
  USING (true);

-- INSERT: admin only (doctor rows are created during onboarding)
DROP POLICY IF EXISTS "doctors_insert" ON doctors;
CREATE POLICY "doctors_insert" ON doctors FOR INSERT
  WITH CHECK (current_user_role() = 'admin');


-- ============================================================
-- 5. FIX INVOICES POLICIES (break recursion via helper functions)
-- ============================================================

DROP POLICY IF EXISTS "invoices_select" ON invoices;
CREATE POLICY "invoices_select" ON invoices FOR SELECT
  USING (
    current_user_role() = 'admin'
    OR is_patient_on_appointment(appointment_id)
    OR is_doctor_on_appointment(appointment_id)
  );

-- INSERT/UPDATE: unchanged
DROP POLICY IF EXISTS "invoices_insert" ON invoices;
CREATE POLICY "invoices_insert" ON invoices FOR INSERT
  WITH CHECK (current_user_role() IN ('admin', 'doctor'));

DROP POLICY IF EXISTS "invoices_update" ON invoices;
CREATE POLICY "invoices_update" ON invoices FOR UPDATE
  USING (current_user_role() IN ('admin', 'doctor'));


-- ============================================================
-- 6. FIX RECEIPTS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "receipts_select" ON receipts;
CREATE POLICY "receipts_select" ON receipts FOR SELECT
  USING (
    current_user_role() = 'admin'
    OR is_patient_on_invoice(invoice_id)
  );

-- INSERT: unchanged
DROP POLICY IF EXISTS "receipts_insert" ON receipts;
CREATE POLICY "receipts_insert" ON receipts FOR INSERT
  WITH CHECK (current_user_role() IN ('admin', 'doctor'));


-- ============================================================
-- 7. FIX MEDICAL CERTIFICATES POLICIES
-- ============================================================

DROP POLICY IF EXISTS "certs_select" ON medical_certificates;
CREATE POLICY "certs_select" ON medical_certificates FOR SELECT
  USING (
    current_user_role() = 'admin'
    OR is_patient_on_appointment(appointment_id)
    OR is_doctor_on_appointment(appointment_id)
  );

-- INSERT/UPDATE: unchanged
DROP POLICY IF EXISTS "certs_insert" ON medical_certificates;
CREATE POLICY "certs_insert" ON medical_certificates FOR INSERT
  WITH CHECK (current_user_role() IN ('admin', 'doctor'));

DROP POLICY IF EXISTS "certs_update" ON medical_certificates;
CREATE POLICY "certs_update" ON medical_certificates FOR UPDATE
  USING (current_user_role() IN ('admin', 'doctor'));


-- ============================================================
-- 8. OPTIONAL SEED: Default chat channel
--    Uncomment and run once after you have at least one user.
--    This creates a "Front Desk" channel and adds ALL existing
--    profiles as members so everyone can chat immediately.
-- ============================================================
-- INSERT INTO chat_channels (id, name, description)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'Front Desk', 'Clinic coordination channel')
-- ON CONFLICT (id) DO NOTHING;
--
-- INSERT INTO channel_members (channel_id, profile_id)
-- SELECT '00000000-0000-0000-0000-000000000001', id
-- FROM profiles
-- ON CONFLICT (channel_id, profile_id) DO NOTHING;
