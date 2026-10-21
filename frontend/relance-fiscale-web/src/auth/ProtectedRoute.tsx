import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';
import { Loader } from '@/components/common/Loader';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { estAuthentifie, chargementInitial } = useAuthContext();

  if (chargementInitial) {
    return <Loader />;
  }

  if (!estAuthentifie) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}