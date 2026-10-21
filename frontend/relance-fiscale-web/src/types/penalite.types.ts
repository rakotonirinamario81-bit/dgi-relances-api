export interface ResultatCalculPenalites {
  detteId: number;
  referenceDette: string;
  nomContribuable: string;
  nif: string;
  impot: string;
  periodeFiscale: string;
  dateEcheance: string;
  dateCalcul: string;
  joursRetard: number;
  moisRetard: number;
  montantPrincipal: number;
  montantDejaPaye: number;
  soldePrincipalRestant: number;
  tauxPenalite: number;
  montantPenalite: number;
  tauxInteretMensuel: number;
  montantInterets: number;
  remiseGracieuse: number;
  motifRemise: string;
  totalPenalitesEtInterets: number;
  totalExigible: number;
  articleCGI: string;
  explicationCalcul: string;
}

export interface SimulationPenaliteRequest {
  dateCalcul?: string;
  tauxPenalite?: number;
  tauxInteretMensuel?: number;
}

export interface AppliquerPenaliteRequest {
  dateCalcul?: string;
  tauxPenalite?: number;
  tauxInteretMensuel?: number;
  remiseGracieuse?: number;
  motifRemise?: string;
}

export interface RemiseGracieuseRequest {
  montantRemise: number;
  motif: string;
}
