import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';

interface Props {
  allowedRoles?: UserRole[];
  children: ReactNode;
}

const ROLE_HOME: Record<UserRole, string> = {
  admin:   '/',
  doctor:  '/doctor',
  patient: '/patient',
};

export function ProtectedRoute({ allowedRoles, children }: Props) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-3 border-t-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect to the user's correct dashboard
    return <Navigate to={ROLE_HOME[role]} replace />;
  }

  return <>{children}</>;
}
