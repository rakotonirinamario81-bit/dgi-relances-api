export type StatutMoratoire = 'ACTIF' | 'SOLDE' | 'RESILIE' | 'CADUC';
export type StatutEcheanceMoratoire = 'EN_ATTENTE' | 'PAYE' | 'EN_RETARD' | 'ANNULE';

export interface EcheanceMoratoireDTO {
  id: number;
  moratoireId: number;
  numeroEcheance: number;
  dateEcheance: string; // ISO date YYYY-MM-DD
  montant: number;
  montantPaye: number;
  statut: StatutEcheanceMoratoire;
  datePaiement?: string;
  paiementId?: number;
}

export interface MoratoireDTO {
  id: number;
  reference: string;
  dateAccord: string;
  dateDebut: string;
  montantTotal: number;
  nombreEcheances: number;
  montantMensualite: number;
  statut: StatutMoratoire;
  commentaire?: string;
  createdAt: string;
  montantTotalPaye: number;
  soldeRestantMoratoire: number;
  pourcentagePaye: number;
  detteFiscaleId: number;
  soldeRestantDette: number;
  statutDette: string;
  periodeFiscale: string;
  nomContribuable: string;
  nif: string;
  email?: string;
  telephone?: string;
  commune?: string;
  impot?: string;
  impotCode?: string;
  echeances?: EcheanceMoratoireDTO[];
}

export interface MoratoireCreationRequest {
  detteFiscaleId: number;
  nombreEcheances: number;
  dateDebut: string;
  commentaire?: string;
}

export interface EcheancePaiementRequest {
  montant: number;
  modePaiement: string;
  reference?: string;
}
