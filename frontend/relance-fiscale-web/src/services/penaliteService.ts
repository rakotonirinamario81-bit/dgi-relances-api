import { apiClient } from './apiClient';
import type {
  ResultatCalculPenalites,
  SimulationPenaliteRequest,
  AppliquerPenaliteRequest,
  RemiseGracieuseRequest,
} from '@/types/penalite.types';

export const penaliteService = {
  /** Simule en temps réel le calcul des pénalités et intérêts de retard. */
  async simuler(detteId: number, req?: SimulationPenaliteRequest): Promise<ResultatCalculPenalites> {
    const { data } = await apiClient.post<ResultatCalculPenalites>(
      `/dettes-fiscales/${detteId}/penalites/simuler`,
      req || {}
    );
    return data;
  },

  /** Applique officiellement le décompte des majorations et intérêts à la dette. */
  async appliquer(detteId: number, req?: AppliquerPenaliteRequest): Promise<ResultatCalculPenalites> {
    const { data } = await apiClient.post<ResultatCalculPenalites>(
      `/dettes-fiscales/${detteId}/penalites/appliquer`,
      req || {}
    );
    return data;
  },

  /** Enregistre une remise gracieuse administrative accordée par l'administration. */
  async accorderRemiseGracieuse(detteId: number, req: RemiseGracieuseRequest): Promise<ResultatCalculPenalites> {
    const { data } = await apiClient.post<ResultatCalculPenalites>(
      `/dettes-fiscales/${detteId}/penalites/remise-gracieuse`,
      req
    );
    return data;
  },

  /** Télécharge le Bordereau officiel de Décompte en PDF certifié. */
  async telechargerBordereauPdf(
    detteId: number,
    params?: { dateCalcul?: string; tauxPenalite?: number; tauxInteretMensuel?: number }
  ): Promise<void> {
    const response = await apiClient.get(`/dettes-fiscales/${detteId}/penalites/decompte-pdf`, {
      params,
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `decompte-penalites-creance-${detteId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
