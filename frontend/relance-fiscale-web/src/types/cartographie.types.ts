export interface ZoneRisque {
  commune: string;
  montantImpaye: number;
  montantTotal: number;
  nbContribuables: number;
  nbDettesEnRetard: number;
  tauxRecouvrement: number;
  niveauRisque: 'ELEVE' | 'MOYEN' | 'FAIBLE';
}

export interface ContribuableLocalite {
  detteId: number;
  nif: string;
  nom: string;
  impot: string;
  soldeRestant: number;
  statut: string;
  niveauRisque: string;
}
