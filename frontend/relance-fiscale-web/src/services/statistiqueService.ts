import { apiClient } from './apiClient';

export const statistiqueService = {
  async repartitionParImpot(): Promise<Record<string, number>> {
    const { data } = await apiClient.get<Record<string, number>>('/statistiques/repartition-par-impot');
    return data;
  },

  async evolutionMensuelle(): Promise<Record<string, number>> {
    const { data } = await apiClient.get<Record<string, number>>('/statistiques/evolution-mensuelle');
    return data;
  },

  /** Retourne un objet {commune: montant} trié par montant décroissant. */
  async zonesImpayes(limite = 10): Promise<Record<string, number>> {
    const { data } = await apiClient.get<Record<string, number>>('/statistiques/zones-impayes', {
      params: { limite },
    });
    return data;
  },
};