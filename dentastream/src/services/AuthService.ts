import { supabase } from '../lib/supabase';
import { sanitize, sanitizeEmail } from '../lib/sanitize';
import { handleSupabaseError } from '../lib/errors';
import type { ServiceResult, UserRole } from '../types';

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  role?: UserRole;   // defaults to 'patient' if omitted
  contact?: string;
}

export class AuthService {
  /**
   * Sign in with email + password.
   * Returns the user's role or an error string.
   */
  static async login({ email, password }: LoginPayload): Promise<ServiceResult<{ role: UserRole }>> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizeEmail(email),
        password,                  // passwords are NOT sanitized (hashed by Supabase)
      });
      if (error) return { data: null, error: error.message };

      // Fetch role from profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError) return { data: null, error: profileError.message };
      return { data: { role: profile.role as UserRole }, error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  /**
   * Register a new user. Role defaults to 'patient'.
   * The matching `profiles` row is created automatically by the
   * `handle_new_user` DB trigger from the metadata passed here — the client
   * does NOT insert into `profiles` (RLS would block it, and there is no
   * session yet when email confirmation is enabled).
   */
  static async register({
    email,
    password,
    full_name,
    role = 'patient',
    contact,
  }: RegisterPayload): Promise<ServiceResult<boolean>> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: sanitizeEmail(email),
        password,
        options: {
          data: {
            full_name: sanitize(full_name),
            role,
            contact: contact ? sanitize(contact) : null,
          },
        },
      });

      if (error) return { data: null, error: error.message };
      if (!data.user) return { data: null, error: 'Registration failed.' };

      return { data: true, error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  static async logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  /**
   * Send a password-recovery email. The email link returns the user to
   * /reset-password, where ResetPasswordPage handles the PASSWORD_RECOVERY
   * session and lets them set a new password.
   */
  static async requestPasswordReset(email: string): Promise<ServiceResult<boolean>> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(sanitizeEmail(email), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) return { data: null, error: error.message };
      return { data: true, error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  /** Set a new password for the currently authenticated user. */
  static async updatePassword(newPassword: string): Promise<ServiceResult<boolean>> {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { data: null, error: error.message };
      return { data: true, error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  static async getCurrentUser() {
    const { data } = await supabase.auth.getUser();
    return data.user;
  }

  static onAuthStateChange(callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
    return supabase.auth.onAuthStateChange(callback);
  }
}
