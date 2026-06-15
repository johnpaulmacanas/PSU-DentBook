import {
  createContext, useContext, useEffect, useState, useCallback,
  type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { AuthService } from '../services/AuthService';
import { ProfileService } from '../services/ProfileService';
import type { Profile, UserRole } from '../types';

export interface LoginResult {
  error: string | null;
  role: UserRole | null;
}

interface AuthContextValue {
  user:    User | null;
  profile: Profile | null;
  role:    UserRole | null;
  loading: boolean;
  login:   (email: string, password: string) => Promise<LoginResult>;
  logout:  () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await ProfileService.getById(userId);
    setProfile(data);
  }, []);

  useEffect(() => {
    AuthService.getCurrentUser().then(async (u) => {
      setUser(u ?? null);
      if (u) await fetchProfile(u.id);
      setLoading(false);
    });

    const { data: { subscription } } = AuthService.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    const { data, error } = await AuthService.login({ email, password });
    return { error, role: data?.role ?? null };
  };

  const logout = async () => {
    await AuthService.logout();
    setUser(null);
    setProfile(null);
  };

  const refresh = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      role: profile?.role ?? null,
      loading,
      login,
      logout,
      refresh,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
