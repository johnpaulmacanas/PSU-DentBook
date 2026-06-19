-- ============================================================
-- DentaStream — Reject paying invoices on cancelled appointments
--
-- Run order:
--   ... → 04_parity.sql → 04_patient_name_visibility_and_pay_rpc.sql
--       → 05_payments.sql → 06_pay_invoice_cancelled_guard.sql
--
-- Fix: a patient could pay a bill whose appointment had already been
-- cancelled by the doctor. The RPC now refuses; the UI hides the button
-- (see PatientBillingPage.tsx).
--
-- Safe to re-run (CREATE OR REPLACE).
-- ============================================================

CREATE OR REPLACE FUNCTION pay_invoice(p_invoice_id UUID)
RETURNS TABLE (receipt_id UUID, receipt_no TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_owner_profile  UUID;
  v_invoice_status invoice_status;
  v_appt_status    appointment_status;
  v_receipt_id     UUID;
  v_receipt_no     TEXT;
BEGIN
  SELECT p.profile_id, i.status, a.status
    INTO v_owner_profile, v_invoice_status, v_appt_status
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

  IF v_invoice_status = 'paid' THEN
    RAISE EXCEPTION 'Invoice already paid';
  END IF;

  IF v_appt_status = 'cancelled' THEN
    RAISE EXCEPTION 'Cannot pay an invoice for a cancelled appointment';
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
