import { apiClient } from './apiClient';
import type { ContribuableScoring, Recommandation, ScoringTableauBord } from '@/types/scoring.types';

export const scoringService = {
  async getTableauBord(): Promise<ScoringTableauBord> {
    const { data } = await apiClient.get<ScoringTableauBord>('/scoring/tableau-bord');
    return data;
  },

  async listerContribuablesARisque(
    niveauRisque?: string,
    page = 0,
    taille = 20
  ): Promise<ContribuableScoring[]> {
    const { data } = await apiClient.get<ContribuableScoring[]>('/scoring/contribuables-a-risque', {
      params: { niveauRisque, page, taille },
    });
    return data;
  },

  async getRecommandations(detteFiscaleId: number): Promise<Recommandation[]> {
    const { data } = await apiClient.get<Recommandation[]>(`/scoring/recommandations/${detteFiscaleId}`);
    return data;
  },
};
