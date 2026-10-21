import type { NiveauRisque } from './detteFiscale.types';

export type StatutCampagne = 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';

export interface CampagneRelance {
  id: number;
  nom: string;
  description?: string;
  impotCibleId?: number;
  impotCibleCode?: string;
  impotCibleLibelle?: string;
  periodeFiscaleCible?: string;
  joursRetardMin?: number;
  niveauRisqueCible?: NiveauRisque;
  modeleMessageId: number;
  modeleMessageNom?: string;
  canal?: string;
  dateDebut: string;
  dateFin?: string;
  statut: StatutCampagne;
  createurNom?: string;
  dateCreation?: string;
  nombreRelancesEnvoyees: number;
  nombreEchecs: number;
  totalRelances: number;
  tauxReussite: number;
}

export interface CampagneRelanceDTO {
  nom: string;
  description?: string;
  impotCibleId?: number;
  periodeFiscaleCible?: string;
  joursRetardMin?: number;
  niveauRisqueCible?: NiveauRisque;
  modeleMessageId: number;
  dateDebut: string;
  dateFin?: string;
}

export interface EstimationCiblage {
  nombreContribuablesCibles: number;
  nombreDettesCibles: number;
  montantTotalCible: number;
}