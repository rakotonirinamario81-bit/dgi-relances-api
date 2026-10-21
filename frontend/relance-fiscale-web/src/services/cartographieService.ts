import { apiClient } from './apiClient';
import type { ContribuableLocalite, ZoneRisque } from '@/types/cartographie.types';

export const cartographieService = {
  async getZonesRisque(): Promise<ZoneRisque[]> {
    const { data } = await apiClient.get<ZoneRisque[]>('/cartographie/zones-risque');
    return data;
  },

  async getContribuablesParCommune(commune: string): Promise<ContribuableLocalite[]> {
    const { data } = await apiClient.get<ContribuableLocalite[]>('/cartographie/contribuables-localite', {
      params: { commune },
    });
    return data;
  },
};
