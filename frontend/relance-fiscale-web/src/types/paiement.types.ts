export type ModePaiement = 'ESPECES' | 'VIREMENT' | 'MOBILE_MONEY' | 'CHEQUE';

export interface Paiement {
  id: number;
  numeroQuittance?: string;
  detteFiscaleId: number;
  montant: number;
  datePaiement: string;
  modePaiement: ModePaiement;
  reference?: string;
  soldeRestant?: number;
  statutDette?: string;
  nomContribuable?: string;
  nif?: string;
  email?: string;
  telephone?: string;
  commune?: string;
  impot?: string;
  impotCode?: string;
  periodeFiscale?: string;
}

export interface PaiementDTO {
  detteFiscaleId: number;
  montant: number;
  modePaiement: ModePaiement;
  reference?: string;
}