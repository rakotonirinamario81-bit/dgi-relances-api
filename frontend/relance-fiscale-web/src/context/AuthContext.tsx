import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authService } from '@/services/authService';
import type { JwtResponse, LoginRequest } from '@/types/api.types';

interface AuthContextValue {
  utilisateur: JwtResponse | null;
  estAuthentifie: boolean;
  chargementInitial: boolean;
  login: (requete: LoginRequest) => Promise<void>;
  logout: () => void;
  aLeRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [utilisateur, setUtilisateur] = useState<JwtResponse | null>(null);
  const [chargementInitial, setChargementInitial] = useState(true);

  useEffect(() => {
    const utilisateurStocke = authService.obtenirUtilisateurConnecte();
    if (utilisateurStocke && authService.estAuthentifie()) {
      setUtilisateur(utilisateurStocke);
    }
    setChargementInitial(false);
  }, []);

  async function login(requete: LoginRequest) {
    const reponse = await authService.login(requete);
    setUtilisateur(reponse);
  }

  function logout() {
    authService.logout();
    setUtilisateur(null);
  }

  function aLeRole(role: string): boolean {
    return utilisateur?.roles.includes(`ROLE_${role}`) ?? false;
  }

  return (
    <AuthContext.Provider
      value={{
        utilisateur,
        estAuthentifie: utilisateur !== null,
        chargementInitial,
        login,
        logout,
        aLeRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext doit être utilisé à l’intérieur de AuthProvider');
  }
  return context;
}