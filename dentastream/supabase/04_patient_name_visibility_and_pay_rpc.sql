-- ============================================================
-- DentaStream — Patient/doctor name visibility + patient pay RPC
--
-- Run order:
--   schema.sql → 02_workflow.sql → 03_fix_rls_recursion.sql → 04_*.sql
--
-- Fixes:
--   1. Patients seeing "Dentist" instead of doctor names (intake form,
--      embedded doctor.profile reads).
--   2. Doctors seeing "Unknown" patient names in "My Patients" and the
--      Chair Schedule (embedded patient.profile reads).
--   3. Patients failing to pay a bill with:
--        new row violates row-level security policy for table "receipts"
--      RLS only allowed admin/doctor to insert receipts AND to update
--      invoices, so the patient-side flow had no path. Replaced with a
--      SECURITY DEFINER RPC that issues the receipt and flips the invoice
--      to paid atomically.
--
-- Safe to re-run.
-- ============================================================


-- ============================================================
-- 1. CROSS-ROLE PROFILE VISIBILITY HELPERS
-- ============================================================

CREATE OR REPLACE FUNCTION is_doctor_profile(p_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (SELECT 1 FROM doctors WHERE profile_id = p_profile_id);
$$;

CREATE OR REPLACE FUNCTION is_my_patient_profile(p_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM appointments a
    JOIN doctors d  ON d.id = a.doctor_id
    JOIN patients p ON p.id = a.patient_id
    WHERE p.profile_id = p_profile_id
      AND d.profile_id = auth.uid()
  );
$$;


-- ============================================================
-- 2. REPLACE profiles_select TO ALLOW CROSS-ROLE READS
--    own + admin (existing) + any doctor profile + your own patients
-- ============================================================

DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (
    id = auth.uid()
    OR current_user_role() = 'admin'
    OR is_doctor_profile(id)
    OR is_my_patient_profile(id)
  );


-- ============================================================
-- 3. pay_invoice RPC — patient-side bill payment
--    Inserts the receipt and marks the invoice paid atomically.
--    Runs as definer so it bypasses receipts_insert / invoices_update RLS.
-- ============================================================

CREATE OR REPLACE FUNCTION pay_invoice(p_invoice_id UUID)
RETURNS TABLE (receipt_id UUID, receipt_no TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_owner_profile UUID;
  v_status        invoice_status;
  v_receipt_id    UUID;
  v_receipt_no    TEXT;
BEGIN
  SELECT p.profile_id, i.status
    INTO v_owner_profile, v_status
  FROM invoices i
  JOIN appointments a ON a.id = i.appointment_id
  JOIN patients p     ON p.id = a.patient_id
  WHERE i.id = p_invoice_id;

  IF v_owner_profile IS NULL THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  IF NOT (
    v_owner_profile = auth.uid()
    OR current_user_role() IN ('admin', 'doctor')
  ) THEN
    RAISE EXCEPTION 'Not authorized to pay this invoice';
  END IF;

  IF v_status = 'paid' THEN
    RAISE EXCEPTION 'Invoice already paid';
  END IF;

  v_receipt_no := 'R-' || to_char(now(), 'YYYYMMDD') || '-'
                  || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  INSERT INTO receipts (invoice_id, receipt_no)
  VALUES (p_invoice_id, v_receipt_no)
  RETURNING id INTO v_receipt_id;

  UPDATE invoices SET status = 'paid' WHERE id = p_invoice_id;

  RETURN QUERY SELECT v_receipt_id, v_receipt_no;
END;
$$;

GRANT EXECUTE ON FUNCTION pay_invoice(UUID) TO authenticated;
