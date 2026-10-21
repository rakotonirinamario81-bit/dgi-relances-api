import type { NiveauRelance } from './detteFiscale.types';

export type CanalNotification = 'SMS' | 'EMAIL' | 'SMS_ET_EMAIL';
export type StatutEnvoi = 'PLANIFIE' | 'ENVOYE' | 'ECHEC';

export interface Relance {
  id: number;
  detteFiscaleId: number;
  nomContribuable: string;
  niveauRelance: NiveauRelance;
  canal: CanalNotification;
  statutEnvoi: StatutEnvoi;
  dateEnvoi?: string;
  documentPdfGenere: boolean;
  motifEchec?: string;
}

export interface RelanceDTO {
  detteFiscaleId: number;
  modeleMessageId?: number;
  canal?: CanalNotification;
  messageSms?: string;
  messageEmail?: string;
  objetEmail?: string;
}

export interface RelanceApercu {
  detteFiscaleId: number;
  nomContribuable: string;
  nif: string;
  telephone?: string;
  email?: string;
  impotLibelle: string;
  impotCode: string;
  periodeFiscale: string;
  montantDu: number;
  montantPaye: number;
  soldeRestant: number;
  dateEcheance: string;
  joursRetard: number;
  messageSms: string;
  objetEmail: string;
  corpsEmail: string;
}