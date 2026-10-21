import { apiClient } from './apiClient';
import type { Contribuable, ContribuableDTO } from '@/types/contribuable.types';
import type { PageResponse } from '@/types/api.types';

function videVersIndefini(valeur?: string): string | undefined {
  const texte = valeur?.trim();
  return texte ? texte : undefined;
}

function normaliserDto(dto: ContribuableDTO): ContribuableDTO {
  return {
    nif: dto.nif.trim(),
    typeContribuable: dto.typeContribuable,
    nomOuRaisonSociale: dto.nomOuRaisonSociale.trim(),
    adresse: videVersIndefini(dto.adresse),
    commune: videVersIndefini(dto.commune),
    telephone: videVersIndefini(dto.telephone),
    email: videVersIndefini(dto.email),
  };
}

export const contribuableService = {
  async creer(dto: ContribuableDTO): Promise<Contribuable> {
    const { data } = await apiClient.post<Contribuable>('/contribuables', normaliserDto(dto));
    return data;
  },

  async obtenirParId(id: number): Promise<Contribuable> {
    const { data } = await apiClient.get<Contribuable>(`/contribuables/${id}`);
    return data;
  },

  async rechercher(params: {
    nif?: string;
    nom?: string;
    commune?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<Contribuable>> {
    const { data } = await apiClient.get<PageResponse<Contribuable>>('/contribuables', { params });
    return data;
  },

  async modifier(id: number, dto: ContribuableDTO): Promise<Contribuable> {
    const { data } = await apiClient.put<Contribuable>(`/contribuables/${id}`, normaliserDto(dto));
    return data;
  },

  async supprimer(id: number): Promise<void> {
    await apiClient.delete(`/contribuables/${id}`);
  },
};