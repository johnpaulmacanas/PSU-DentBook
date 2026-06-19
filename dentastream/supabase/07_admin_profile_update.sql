-- ============================================================
-- DentaStream — Admin can update any profile
--
-- Run order:
--   ... → 06_pay_invoice_cancelled_guard.sql → 07_admin_profile_update.sql
--
-- Problem: profiles_update_own only allows id = auth.uid(), so reception
-- (admin role) cannot update a patient's address / phone / name on the
-- patient's behalf. Add an admin-update policy that coexists with the
-- self-update policy (Postgres OR-s multiple UPDATE policies).
--
-- Safe to re-run.
-- ============================================================

DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE
  USING      (current_user_role() = 'admin')
  WITH CHECK (current_user_role() = 'admin');
