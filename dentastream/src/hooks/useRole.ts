import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';

/**
 * Convenience accessor for the current user's role + role predicates.
 * Thin wrapper over {@link useAuth} so components don't repeat the checks.
 */
export function useRole() {
  const { role } = useAuth();
  return {
    role,
    isAdmin:   role === 'admin',
    isDoctor:  role === 'doctor',
    isPatient: role === 'patient',
    is: (...roles: UserRole[]) => role !== null && roles.includes(role),
  };
}
