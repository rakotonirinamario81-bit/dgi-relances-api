export interface QuittanceVerificationDTO {
  numeroQuittance: string;
  datePaiement: string;
  nomContribuable: string;
  nifMasque: string;
  commune: string;
  impot: string;
  periodeFiscale: string;
  montant: number;
  modePaiement: string;
  reference: string;
  statutAuthenticite: string;
  estValide: boolean;
  dateVerification: string;
}

export interface SituationFiscalePubliqueDTO {
  nif: string;
  nomContribuable: string;
  commune: string;
  estEnRegle: boolean;
  statutFiscal: string;
  nombreDettesSoldees: number;
  nombreDettesEnCours: number;
  soldeRestantGlobal: number;
  dateDelivrance: string;
  codeAttestation: string;
  mentionsLegales: string;
}
