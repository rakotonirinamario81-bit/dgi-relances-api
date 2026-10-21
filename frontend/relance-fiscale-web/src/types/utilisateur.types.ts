export type NomRole = 'ADMIN' | 'RESPONSABLE_RECOUVREMENT' | 'AGENT_RECOUVREMENT';

export interface Utilisateur {
  id: number;
  nom: string;
  prenom?: string;
  email: string;
  telephone?: string;
  actif: boolean;
  roles: NomRole[];
}

export interface UtilisateurDTO {
  nom: string;
  prenom?: string;
  email: string;
  motDePasse: string;
  telephone?: string;
  roles: NomRole[];
}