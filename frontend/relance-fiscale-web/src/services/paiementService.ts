import { apiClient } from './apiClient';
import type { Paiement, PaiementDTO } from '@/types/paiement.types';

export const paiementService = {
  /** Enregistre un versement fiscal et retourne les détails de la quittance créée. */
  async enregistrer(dto: PaiementDTO): Promise<Paiement> {
    const { data } = await apiClient.post<Paiement>('/paiements', dto);
    return data;
  },

  /** Liste tous les paiements et quittances enregistrés dans l'administration. */
  async listerTous(): Promise<Paiement[]> {
    const { data } = await apiClient.get<Paiement[]>('/paiements');
    return data;
  },

  /** Obtient les détails d'un paiement spécifique. */
  async obtenirParId(id: number): Promise<Paiement> {
    const { data } = await apiClient.get<Paiement>(`/paiements/${id}`);
    return data;
  },

  /** Liste les paiements enregistrés pour une dette fiscale. */
  async listerParDette(detteFiscaleId: number): Promise<Paiement[]> {
    const { data } = await apiClient.get<Paiement[]>(`/paiements/dette/${detteFiscaleId}`);
    return data;
  },

  /** Télécharge la quittance de paiement officielle en PDF. */
  async telechargerQuittancePdf(paiementId: number): Promise<void> {
    const response = await apiClient.get(`/paiements/${paiementId}/quittance-pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `quittance-paiement-${paiementId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};