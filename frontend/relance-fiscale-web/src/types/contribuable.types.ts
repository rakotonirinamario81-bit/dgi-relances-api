export type TypeContribuable = 'PERSONNE_PHYSIQUE' | 'PERSONNE_MORALE';

export interface Contribuable {
  id: number;
  nif: string;
  typeContribuable: TypeContribuable;
  nomOuRaisonSociale: string;
  nomAffichage: string;
  adresse?: string;
  commune?: string;
  telephone?: string;
  email?: string;
  nombreDettesActives: number;
}

export interface ContribuableDTO {
  nif: string;
  typeContribuable: TypeContribuable;
  nomOuRaisonSociale: string;
  adresse?: string;
  commune?: string;
  telephone?: string;
  email?: string;
}