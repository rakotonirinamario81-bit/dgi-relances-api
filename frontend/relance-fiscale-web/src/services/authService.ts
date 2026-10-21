import { apiClient } from './apiClient';
import type { JwtResponse, LoginRequest } from '@/types/api.types';

const TOKEN_KEY = 'relance_fiscale_token';
const USER_KEY = 'relance_fiscale_user';

export const authService = {
  async login(requete: LoginRequest): Promise<JwtResponse> {
    const { data } = await apiClient.post<JwtResponse>('/auth/login', requete);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data));
    return data;
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  obtenirUtilisateurConnecte(): JwtResponse | null {
    const brut = localStorage.getItem(USER_KEY);
    return brut ? (JSON.parse(brut) as JwtResponse) : null;
  },

  estAuthentifie(): boolean {
    return localStorage.getItem(TOKEN_KEY) !== null;
  },

  aLeRole(role: string): boolean {
    const utilisateur = this.obtenirUtilisateurConnecte();
    return utilisateur?.roles.includes(`ROLE_${role}`) ?? false;
  },
};