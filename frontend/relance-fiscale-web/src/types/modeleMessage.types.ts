import type { CanalNotification } from './relance.types';
import type { NiveauRelance } from './detteFiscale.types';

export type { CanalNotification };

export interface ModeleMessage {
  id: number;
  nom: string;
  canal: CanalNotification;
  niveauRelanceAssocie?: NiveauRelance;
  contenu: string;
  objet?: string;
  actif: boolean;
}

export interface ModeleMessageDTO {
  nom: string;
  canal: CanalNotification;
  niveauRelanceAssocie?: NiveauRelance;
  contenu: string;
  objet?: string;
}