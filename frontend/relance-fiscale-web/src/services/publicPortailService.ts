import { apiClient } from './apiClient';
import type { QuittanceVerificationDTO, SituationFiscalePubliqueDTO } from '@/types/publicPortail.types';

export const publicPortailService = {
  /** Vérifie l'authenticité d'une quittance fiscale via sa référence ou son ID. */
  async verifierQuittance(reference: string): Promise<QuittanceVerificationDTO> {
    const { data } = await apiClient.get<QuittanceVerificationDTO>(
      `/public/quittance/${encodeURIComponent(reference)}`
    );
    return data;
  },

  /** Consulte la situation fiscale d'un contribuable via son NIF. */
  async consulterSituation(nif: string): Promise<SituationFiscalePubliqueDTO> {
    const { data } = await apiClient.get<SituationFiscalePubliqueDTO>(
      `/public/situation/${encodeURIComponent(nif)}`
    );
    return data;
  },

  /** Télécharge l'Attestation Officielle de Situation Fiscale / Quitus Fiscal PDF. */
  async telechargerAttestationPdf(nif: string): Promise<void> {
    const res = await apiClient.get(`/public/situation/${encodeURIComponent(nif)}/attestation-pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `attestation-fiscale-${nif}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
