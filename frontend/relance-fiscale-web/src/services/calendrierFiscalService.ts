import { apiClient } from './apiClient';
import type {
  CalendrierFiscal,
  CalendrierFiscalDTO,
  DeclarationFiscale,
  DeclarationFiscaleDTO,
  EcheanceFiscale,
  RelanceEcheanceDTO,
} from '@/types/calendrierFiscal.types';

export const calendrierFiscalService = {
  // --- Calendrier Fiscal ---
  async listerRegles(): Promise<CalendrierFiscal[]> {
    const { data } = await apiClient.get<CalendrierFiscal[]>('/calendrier-fiscal');
    return data;
  },

  async enregistrerRegle(dto: CalendrierFiscalDTO): Promise<CalendrierFiscal> {
    const { data } = await apiClient.post<CalendrierFiscal>('/calendrier-fiscal', dto);
    return data;
  },

  async calculerDateLimite(impotId: number, periode: string): Promise<{ dateLimite: string }> {
    const { data } = await apiClient.get<{ dateLimite: string }>('/calendrier-fiscal/calculer-date-limite', {
      params: { impotId, periode },
    });
    return data;
  },

  async genererEcheances(impotId: number, periode: string): Promise<{ message: string; nombreEcheancesCreees: number }> {
    const { data } = await apiClient.post<{ message: string; nombreEcheancesCreees: number }>(
      '/calendrier-fiscal/generer-echeances',
      null,
      { params: { impotId, periode } }
    );
    return data;
  },

  async creerEcheance(contribuableId: number, impotId: number, periode: string): Promise<EcheanceFiscale> {
    const { data } = await apiClient.post<EcheanceFiscale>('/calendrier-fiscal/creer-echeance', null, {
      params: { contribuableId, impotId, periode },
    });
    return data;
  },

  // --- Échéances & Défaillants ---
  async listerEcheances(): Promise<EcheanceFiscale[]> {
    const { data } = await apiClient.get<EcheanceFiscale[]>('/echeances-fiscales');
    return data;
  },

  async listerDefaillants(): Promise<EcheanceFiscale[]> {
    const { data } = await apiClient.get<EcheanceFiscale[]>('/echeances-fiscales/defaillants');
    return data;
  },

  async obtenirEcheance(id: number): Promise<EcheanceFiscale> {
    const { data } = await apiClient.get<EcheanceFiscale>(`/echeances-fiscales/${id}`);
    return data;
  },

  async listerParContribuable(contribuableId: number): Promise<EcheanceFiscale[]> {
    const { data } = await apiClient.get<EcheanceFiscale[]>(`/echeances-fiscales/contribuable/${contribuableId}`);
    return data;
  },

  // --- Déclarations ---
  async enregistrerDeclaration(dto: DeclarationFiscaleDTO): Promise<DeclarationFiscale> {
    const { data } = await apiClient.post<DeclarationFiscale>('/echeances-fiscales/declarations', dto);
    return data;
  },

  // --- Relances Défaillants ---
  async relancerDefaillant(dto: RelanceEcheanceDTO): Promise<{ message: string; relanceId: number }> {
    const { data } = await apiClient.post<{ message: string; relanceId: number }>(
      `/echeances-fiscales/${dto.echeanceId}/relancer`,
      dto
    );
    return data;
  },

  async telechargerLettrePdf(echeanceId: number): Promise<void> {
    const response = await apiClient.get(`/echeances-fiscales/${echeanceId}/pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = `lettre_relance_dgi_${echeanceId}.pdf`;
    document.body.appendChild(lien);
    lien.click();

    // Important pour Chrome/Edge : ne jamais révoquer le Blob URL immédiatement
    // sinon le gestionnaire de téléchargement lit un blob vide (fichier de 0 Ko)
    setTimeout(() => {
      if (document.body.contains(lien)) {
        document.body.removeChild(lien);
      }
      window.URL.revokeObjectURL(url);
    }, 15000);
  },

  async ouvrirLettrePdfDansNouvelOnglet(echeanceId: number): Promise<void> {
    const response = await apiClient.get(`/echeances-fiscales/${echeanceId}/pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 60000);
  },
};
