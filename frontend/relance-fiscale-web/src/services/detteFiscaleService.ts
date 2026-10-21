import { apiClient } from './apiClient';
import type { DetteFiscale, DetteFiscaleDTO, DetteFiscaleMiseAJourDTO } from '@/types/detteFiscale.types';

export const detteFiscaleService = {
  async creer(dto: DetteFiscaleDTO): Promise<DetteFiscale> {
    const { data } = await apiClient.post<DetteFiscale>('/dettes-fiscales', dto);
    return data;
  },

  async obtenirParId(id: number): Promise<DetteFiscale> {
    const { data } = await apiClient.get<DetteFiscale>(`/dettes-fiscales/${id}`);
    return data;
  },

  async listerToutes(): Promise<DetteFiscale[]> {
    const { data } = await apiClient.get<DetteFiscale[]>('/dettes-fiscales');
    return data;
  },

  async listerParContribuable(contribuableId: number): Promise<DetteFiscale[]> {
    const { data } = await apiClient.get<DetteFiscale[]>(`/dettes-fiscales/contribuable/${contribuableId}`);
    return data;
  },

  async modifier(id: number, dto: DetteFiscaleMiseAJourDTO): Promise<DetteFiscale> {
    const { data } = await apiClient.put<DetteFiscale>(`/dettes-fiscales/${id}`, null, {
      params: {
        impotId: dto.impotId,
        periodeFiscale: dto.periodeFiscale,
        montantDu: dto.montantDu,
        dateEcheance: dto.dateEcheance,
      },
    });
    return data;
  },

  async supprimer(id: number): Promise<void> {
    await apiClient.delete(`/dettes-fiscales/${id}`);
  },

  async enregistrerPaiement(
    id: number,
    montant: number,
    modePaiement: string,
    reference?: string
  ): Promise<DetteFiscale> {
    const { data } = await apiClient.post<DetteFiscale>(`/dettes-fiscales/${id}/paiements`, null, {
      params: { montant, modePaiement, reference },
    });
    return data;
  },

  async cloturer(id: number, motif: string): Promise<DetteFiscale> {
    const { data } = await apiClient.patch<DetteFiscale>(`/dettes-fiscales/${id}/cloturer`, null, {
      params: { motif },
    });
    return data;
  },
};