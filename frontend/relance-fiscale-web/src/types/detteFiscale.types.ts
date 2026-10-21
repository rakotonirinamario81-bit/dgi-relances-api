export type StatutDette =
  | 'A_PAYER'
  | 'PAYE'
  | 'EN_RETARD'
  | 'EN_RELANCE'
  | 'EN_PROCEDURE_RECOUVREMENT'
  | 'CLOTURE';

export type NiveauRisque = 'RISQUE_FAIBLE' | 'RISQUE_MOYEN' | 'RISQUE_ELEVE';

export type NiveauRelance =
  | 'NIVEAU_0_PREVENTIF'
  | 'NIVEAU_1_AMIABLE'
  | 'NIVEAU_2_INTERMEDIAIRE'
  | 'NIVEAU_3_OFFICIEL'
  | 'NIVEAU_4_FORCE';

export interface DetteFiscale {
  id: number;
  contribuableId: number;
  nomContribuable: string;
  /** ID de l'impôt — renvoyé par l'API pour permettre le préremplissage en modification */
  impotId: number;
  impot: string;
  periodeFiscale: string;
  montantDu: number;
  montantPaye: number;
  soldeRestant: number;
  dateEcheance: string; // ISO yyyy-MM-dd
  joursDeRetard: number;
  statut: StatutDette;
  niveauRisque: NiveauRisque | null;
  niveauRelanceCourant: NiveauRelance | null;
  nombreRelancesEnvoyees: number;
  penalitesRetard?: number;
  interetsRetard?: number;
  remiseGracieuse?: number;
  motifRemise?: string;
  montantTotalExigible?: number;
  dateDernierCalculPenalite?: string;
}

export interface DetteFiscaleDTO {
  contribuableId: number;
  impotId: number;
  periodeFiscale: string;
  montantDu: number;
  dateEcheance: string;
}

export interface DetteFiscaleMiseAJourDTO {
  impotId: number;
  periodeFiscale: string;
  montantDu: number;
  dateEcheance: string;
}