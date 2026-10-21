export interface ScoringTableauBord {
  nbRisqueFaible: number;
  nbRisqueMoyen: number;
  nbRisqueEleve: number;
  totalDettes: number;
  montantTotalRisqueEleve: number;
  montantTotalRisqueMoyen: number;
  montantTotalRisqueFaible: number;
}

export interface ContribuableScoring {
  detteId: number;
  nif: string;
  nomContribuable: string;
  commune: string;
  impot: string;
  periode: string;
  soldeRestant: number;
  joursDeRetard: number;
  nombreRelances: number;
  scoreTotal: number;
  scoreMontant: number;
  scoreRetard: number;
  scoreHistorique: number;
  scoreRelancesDette: number;
  niveauRisque: 'RISQUE_FAIBLE' | 'RISQUE_MOYEN' | 'RISQUE_ELEVE';
  statutDette: string;
}

export interface Recommandation {
  priorite: 'URGENTE' | 'HAUTE' | 'NORMALE';
  action: string;
  motif: string;
  delaiSuggere: string;
}
