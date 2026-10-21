import { apiClient } from './apiClient';
import type {
  MoratoireDTO,
  MoratoireCreationRequest,
  EcheanceMoratoireDTO,
  EcheancePaiementRequest,
} from '@/types/moratoire.types';

export const moratoireService = {
  /** Crée un nouvel accord de moratoire avec génération automatique de l'échéancier. */
  async creer(dto: MoratoireCreationRequest): Promise<MoratoireDTO> {
    const { data } = await apiClient.post<MoratoireDTO>('/moratoires', dto);
    return data;
  },

  /** Liste l'ensemble des accords de moratoires. */
  async listerTous(): Promise<MoratoireDTO[]> {
    const { data } = await apiClient.get<MoratoireDTO[]>('/moratoires');
    return data;
  },

  /** Récupère un moratoire par son identifiant avec tout son échéancier. */
  async obtenirParId(id: number): Promise<MoratoireDTO> {
    const { data } = await apiClient.get<MoratoireDTO>(`/moratoires/${id}`);
    return data;
  },

  /** Liste les moratoires associés à une dette fiscale spécifique. */
  async listerParDette(detteFiscaleId: number): Promise<MoratoireDTO[]> {
    const { data } = await apiClient.get<MoratoireDTO[]>(`/moratoires/dette/${detteFiscaleId}`);
    return data;
  },

  /** Enregistre le paiement d'une mensualité du moratoire. */
  async payerEcheance(echeanceId: number, dto: EcheancePaiementRequest): Promise<EcheanceMoratoireDTO> {
    const { data } = await apiClient.post<EcheanceMoratoireDTO>(`/moratoires/echeances/${echeanceId}/payer`, dto);
    return data;
  },

  /** Résilie un moratoire suite à un défaut de paiement ou décision administrative. */
  async annuler(id: number, motif: string): Promise<MoratoireDTO> {
    const { data } = await apiClient.post<MoratoireDTO>(`/moratoires/${id}/annuler`, null, {
      params: { motif },
    });
    return data;
  },

  /** Télécharge la convention officielle de moratoire en format PDF certifié. */
  async telechargerConventionPdf(moratoireId: number): Promise<void> {
    const response = await apiClient.get(`/moratoires/${moratoireId}/convention-pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `convention-moratoire-${moratoireId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
