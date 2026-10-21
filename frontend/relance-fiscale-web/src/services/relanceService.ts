import { apiClient } from './apiClient';
import type { Relance, RelanceDTO, RelanceApercu } from '@/types/relance.types';

export const relanceService = {
  /** Obtient l'aperçu dynamique du SMS et de l'Email générés avec calcul du motif et du solde restant dû. */
  async obtenirApercu(detteFiscaleId: number): Promise<RelanceApercu> {
    const { data } = await apiClient.get<RelanceApercu>(`/relances/apercu/${detteFiscaleId}`);
    return data;
  },

  /** Envoie une relance (automatique ou personnalisée) pour une dette fiscale. */
  async envoyerManuelle(dto: RelanceDTO): Promise<Relance> {
    const { data } = await apiClient.post<Relance>('/relances/manuelle', dto);
    return data;
  },

  /** Liste l'historique des relances envoyées pour une dette fiscale. */
  async listerParDette(detteFiscaleId: number): Promise<Relance[]> {
    const { data } = await apiClient.get<Relance[]>(`/relances/dette/${detteFiscaleId}`);
    return data;
  },
};