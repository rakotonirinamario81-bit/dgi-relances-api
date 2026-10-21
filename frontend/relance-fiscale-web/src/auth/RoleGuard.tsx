import type { ReactNode } from 'react';
import { useAuthContext } from '@/context/AuthContext';

interface RoleGuardProps {
  rolesAutorises: string[];
  children: ReactNode;
  contenuAlternatif?: ReactNode;
}

/** Masque son contenu si l'utilisateur n'a aucun des rôles autorisés (RBAC côté UI, en plus du RBAC serveur). */
export function RoleGuard({ rolesAutorises, children, contenuAlternatif = null }: RoleGuardProps) {
  const { aLeRole } = useAuthContext();
  const autorise = rolesAutorises.some((role) => aLeRole(role));
  return autorise ? <>{children}</> : <>{contenuAlternatif}</>;
}