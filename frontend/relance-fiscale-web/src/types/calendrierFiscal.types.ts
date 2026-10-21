export type StatutEcheance = 'EN_ATTENTE' | 'DEPOT_EFFECTUE' | 'EN_RETARD' | 'RELANCE' | 'PROCEDURE_OFFICE';

export interface CalendrierFiscal {
  id: number;
  impotId: number;
  impotCode: string;
  impotLibelle: string;
  impotPeriodicite: string;
  jourEcheance: number;
  moisEcheance: number | null;
  decalageMois: number;
  typeEcheance: string;
  delaiGraceJours: number;
  regleTexte: string;
}

export interface CalendrierFiscalDTO {
  impotId: number;
  jourEcheance: number;
  moisEcheance?: number | null;
  decalageMois: number;
  typeEcheance?: string;
  delaiGraceJours?: number;
}

export interface EcheanceFiscale {
  id: number;
  contribuableId: number;
  contribuableNom: string;
  contribuableNif: string;
  contribuableTelephone: string;
  contribuableEmail: string;
  contribuableAdresse: string;
  impotId: number;
  impotCode: string;
  impotLibelle: string;
  periode: string;
  dateLimite: string;
  joursDeRetard: number;
  enRetard: boolean;
  statut: StatutEcheance;
  dateDepot?: string | null;
  montantDeclare?: number | null;
  refAccuseReception?: string | null;
}

export interface EcheanceFiscaleDTO {
  contribuableId: number;
  impotId: number;
  periode: string;
  dateLimite?: string;
}

export interface DeclarationFiscaleDTO {
  echeanceId: number;
  dateDepot?: string;
  montantDeclare?: number;
  methodeDepot?: string;
  refAccuseReception?: string;
}

export interface DeclarationFiscale {
  id: number;
  echeanceId: number;
  contribuableNom: string;
  contribuableNif: string;
  impotLibelle: string;
  periode: string;
  dateDepot: string;
  montantDeclare?: number;
  methodeDepot?: string;
  refAccuseReception?: string;
  dateCreation: string;
}

export interface RelanceEcheanceDTO {
  echeanceId: number;
  canal: 'SMS' | 'EMAIL' | 'SMS_ET_EMAIL';
  messagePersonnalise?: string;
}
