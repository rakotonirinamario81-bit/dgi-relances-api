import { apiClient } from './apiClient';
import type { CampagneRelance, CampagneRelanceDTO, EstimationCiblage } from '@/types/campagneRelance.types';

export const campagneRelanceService = {
  async lister(): Promise<CampagneRelance[]> {
    const { data } = await apiClient.get<CampagneRelance[]>('/campagnes');
    return data;
  },

  async creer(dto: CampagneRelanceDTO): Promise<CampagneRelance> {
    const { data } = await apiClient.post<CampagneRelance>('/campagnes', dto);
    return data;
  },

  async lancer(id: number): Promise<CampagneRelance> {
    const { data } = await apiClient.post<CampagneRelance>(`/campagnes/${id}/lancer`);
    return data;
  },

  async obtenirParId(id: number): Promise<CampagneRelance> {
    const { data } = await apiClient.get<CampagneRelance>(`/campagnes/${id}`);
    return data;
  },

  async estimerCiblage(params: {
    impotId?: number;
    periode?: string;
    joursRetardMin?: number;
    niveauRisque?: string;
  }): Promise<EstimationCiblage> {
    const { data } = await apiClient.get<EstimationCiblage>('/campagnes/ciblage-estimation', { params });
    return data;
  },
};