-- ============================================================
-- DentaStream — Workflow migration (Phase 0)
--
-- Run order:
--   Fresh database  : run schema.sql  THEN  02_workflow.sql
--   Existing database: run 02_workflow.sql  (it is additive + idempotent)
--
-- Adds the patient intake/request workflow, the 6-state appointment status
-- model, optional dentist booking, invoices, receipts, and medical
-- certificates, with RLS + realtime for every new table.
--
-- Safe to re-run: enums use duplicate_object guards, tables use
-- CREATE TABLE IF NOT EXISTS, columns use ADD COLUMN IF NOT EXISTS,
-- and policies are dropped before being recreated.
-- ============================================================

-- ------------------------------------------------------------
-- 1. NEW ENUMS
-- ------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE concern AS ENUM (
    'checkup', 'tooth_pain', 'broken_tooth', 'gum_problem', 'whitening',
    'braces', 'tooth_removal', 'child_visit', 'follow_up', 'not_sure'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE request_status AS ENUM ('pending', 'approved', 'declined');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE invoice_kind AS ENUM ('initial', 'final');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM ('unpaid', 'paid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ------------------------------------------------------------
-- 2. APPOINTMENT_STATUS -> 6-state model
--    Old: scheduled, confirmed, in_progress, completed, cancelled
--    New: pending, scheduled, rescheduled, cancelled, missed, completed
--    Mapping: confirmed/in_progress -> scheduled; others unchanged.
--    Only runs if the new shape ('pending') is not already present.
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'appointment_status' AND e.enumlabel = 'pending'
  ) THEN
    ALTER TABLE appointments ALTER COLUMN status DROP DEFAULT;
    ALTER TYPE appointment_status RENAME TO appointment_status_old;
    CREATE TYPE appointment_status AS ENUM (
      'pending', 'scheduled', 'rescheduled', 'cancelled', 'missed', 'completed'
    );
    ALTER TABLE appointments
      ALTER COLUMN status TYPE appointment_status
      USING (
        CASE status::text
          WHEN 'confirmed'   THEN 'scheduled'
          WHEN 'in_progress' THEN 'scheduled'
          ELSE status::text
        END
      )::appointment_status;
    ALTER TABLE appointments ALTER COLUMN status SET DEFAULT 'pending';
    DROP TYPE appointment_status_old;
  END IF;
END $$;

-- ------------------------------------------------------------
-- 3. PROFILES — intake identity fields
-- ------------------------------------------------------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address   TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birthdate DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sex       gender_type;

-- ------------------------------------------------------------
-- 4. APPOINTMENT_REQUESTS (patient intake / booking request)
--    Separate from a scheduled appointment: an admin approves a
--    request, which then produces an appointments row.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS appointment_requests (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_profile_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  preferred_doctor_id         UUID REFERENCES doctors(id) ON DELETE SET NULL,  -- optional dentist
  concern                     concern NOT NULL,
  notes                       TEXT,
  emergency_contact_name      TEXT,
  emergency_contact_relation  TEXT,
  emergency_contact_number    TEXT,
  allergies                   TEXT,
  medications                 TEXT,
  conditions                  TEXT,
  is_pregnant                 BOOLEAN DEFAULT FALSE,
  consent                     BOOLEAN NOT NULL DEFAULT FALSE,
  request_status              request_status NOT NULL DEFAULT 'pending',
  created_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- Estimated initial fee captured at request time (shown to the patient before
-- they confirm; the admin's initial invoice defaults to this on approval).
ALTER TABLE appointment_requests
  ADD COLUMN IF NOT EXISTS estimated_amount NUMERIC(10,2) NOT NULL DEFAULT 0;

-- ------------------------------------------------------------
-- 5. APPOINTMENTS — link to request + make dentist optional
-- ------------------------------------------------------------
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS request_id UUID REFERENCES appointment_requests(id) ON DELETE SET NULL;
ALTER TABLE appointments ALTER COLUMN doctor_id DROP NOT NULL;

-- ------------------------------------------------------------
-- 6. INVOICES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  kind           invoice_kind   NOT NULL DEFAULT 'initial',
  amount         NUMERIC(10,2)  NOT NULL DEFAULT 0,
  status         invoice_status NOT NULL DEFAULT 'unpaid',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 7. RECEIPTS (e-receipt; printing is client-side)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS receipts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  receipt_no  TEXT UNIQUE NOT NULL,
  issued_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 8. MEDICAL CERTIFICATES (printable; print is client-side)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medical_certificates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id  UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  diagnosis       TEXT,
  recommendation  TEXT,
  valid_from      DATE,
  valid_to        DATE,
  issued_by       UUID REFERENCES profiles(id),
  issued_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 9. INDEXES
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_requests_patient    ON appointment_requests(patient_profile_id);
CREATE INDEX IF NOT EXISTS idx_requests_status     ON appointment_requests(request_status);
CREATE INDEX IF NOT EXISTS idx_invoices_appointment ON invoices(appointment_id);
CREATE INDEX IF NOT EXISTS idx_receipts_invoice    ON receipts(invoice_id);
CREATE INDEX IF NOT EXISTS idx_certs_appointment   ON medical_certificates(appointment_id);

-- ============================================================
-- 10. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE appointment_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices              ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_certificates  ENABLE ROW LEVEL SECURITY;

-- ---- APPOINTMENT REQUESTS ----
DROP POLICY IF EXISTS "requests_select" ON appointment_requests;
CREATE POLICY "requests_select" ON appointment_requests FOR SELECT
  USING (
    patient_profile_id = auth.uid()
    OR current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM doctors d
      WHERE d.id = preferred_doctor_id AND d.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "requests_insert" ON appointment_requests;
CREATE POLICY "requests_insert" ON appointment_requests FOR INSERT
  WITH CHECK (
    (patient_profile_id = auth.uid() AND current_user_role() = 'patient')
    OR current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "requests_update" ON appointment_requests;
CREATE POLICY "requests_update" ON appointment_requests FOR UPDATE
  USING (current_user_role() = 'admin');

-- ---- INVOICES ----  patient/doctor on the appointment can read; admin/doctor write
DROP POLICY IF EXISTS "invoices_select" ON invoices;
CREATE POLICY "invoices_select" ON invoices FOR SELECT
  USING (
    current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM appointments a
      JOIN patients p ON p.id = a.patient_id
      WHERE a.id = invoices.appointment_id AND p.profile_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM appointments a
      JOIN doctors d ON d.id = a.doctor_id
      WHERE a.id = invoices.appointment_id AND d.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "invoices_insert" ON invoices;
CREATE POLICY "invoices_insert" ON invoices FOR INSERT
  WITH CHECK (current_user_role() IN ('admin', 'doctor'));

DROP POLICY IF EXISTS "invoices_update" ON invoices;
CREATE POLICY "invoices_update" ON invoices FOR UPDATE
  USING (current_user_role() IN ('admin', 'doctor'));

-- ---- RECEIPTS ----  follow the invoice -> appointment -> patient chain
DROP POLICY IF EXISTS "receipts_select" ON receipts;
CREATE POLICY "receipts_select" ON receipts FOR SELECT
  USING (
    current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM invoices i
      JOIN appointments a ON a.id = i.appointment_id
      JOIN patients p     ON p.id = a.patient_id
      WHERE i.id = receipts.invoice_id AND p.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "receipts_insert" ON receipts;
CREATE POLICY "receipts_insert" ON receipts FOR INSERT
  WITH CHECK (current_user_role() IN ('admin', 'doctor'));

-- ---- MEDICAL CERTIFICATES ----
DROP POLICY IF EXISTS "certs_select" ON medical_certificates;
CREATE POLICY "certs_select" ON medical_certificates FOR SELECT
  USING (
    current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM appointments a
      JOIN patients p ON p.id = a.patient_id
      WHERE a.id = medical_certificates.appointment_id AND p.profile_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM appointments a
      JOIN doctors d ON d.id = a.doctor_id
      WHERE a.id = medical_certificates.appointment_id AND d.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "certs_insert" ON medical_certificates;
CREATE POLICY "certs_insert" ON medical_certificates FOR INSERT
  WITH CHECK (current_user_role() IN ('admin', 'doctor'));

DROP POLICY IF EXISTS "certs_update" ON medical_certificates;
CREATE POLICY "certs_update" ON medical_certificates FOR UPDATE
  USING (current_user_role() IN ('admin', 'doctor'));

-- ---- PATIENTS: allow a patient to self-provision their own clinical row ----
-- approve() / intake needs a patients row keyed to the profile. Allow patients
-- to insert their own row (profile_id = auth.uid()); admin may insert any.
DROP POLICY IF EXISTS "patients_insert" ON patients;
CREATE POLICY "patients_insert" ON patients FOR INSERT
  WITH CHECK (profile_id = auth.uid() OR current_user_role() = 'admin');

-- ============================================================
-- 11. REALTIME
-- ============================================================
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE appointment_requests;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE invoices;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
