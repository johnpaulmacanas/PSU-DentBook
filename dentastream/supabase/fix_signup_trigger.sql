-- ============================================================
-- HOTFIX: "Database error creating new user" on signup
--
-- Cause: handle_new_user() and current_user_role() are SECURITY DEFINER
-- but had no SET search_path. The signup trigger runs as supabase_auth_admin,
-- whose search_path excludes "public", so "profiles" / "::user_role" can't
-- resolve, the function raises, and the auth.users INSERT rolls back.
--
-- Fix: pin search_path on both functions. Safe to run anytime (idempotent).
-- Paste this whole file into Supabase Dashboard -> SQL Editor -> Run.
-- ============================================================

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

CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- Make sure the trigger is attached (no-op if it already is).
DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
