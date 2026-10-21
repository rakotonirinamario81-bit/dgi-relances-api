import { apiClient } from './apiClient';

function telechargerFichier(blobData: any, nomFichier: string, typeMime: string) {
  const blob = new Blob([blobData], { type: typeMime });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', nomFichier);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export const rapportService = {
  // 1. Dettes fiscales
  async telechargerDettesExcel(): Promise<void> {
    const res = await apiClient.get('/rapports/dettes-fiscales/excel', { responseType: 'blob' });
    telechargerFichier(res.data, 'creances-fiscales-dgi.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  },

  async telechargerDettesCsv(): Promise<void> {
    const res = await apiClient.get('/rapports/dettes-fiscales/csv', { responseType: 'blob' });
    telechargerFichier(res.data, 'creances-fiscales-dgi.csv', 'text/csv; charset=UTF-8');
  },

  // 2. Paiements
  async telechargerPaiementsExcel(): Promise<void> {
    const res = await apiClient.get('/rapports/paiements/excel', { responseType: 'blob' });
    telechargerFichier(res.data, 'journal-encaissements-dgi.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  },

  async telechargerPaiementsCsv(): Promise<void> {
    const res = await apiClient.get('/rapports/paiements/csv', { responseType: 'blob' });
    telechargerFichier(res.data, 'journal-encaissements-dgi.csv', 'text/csv; charset=UTF-8');
  },

  // 3. Moratoires
  async telechargerMoratoiresExcel(): Promise<void> {
    const res = await apiClient.get('/rapports/moratoires/excel', { responseType: 'blob' });
    telechargerFichier(res.data, 'accords-moratoires-dgi.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  },

  async telechargerMoratoiresCsv(): Promise<void> {
    const res = await apiClient.get('/rapports/moratoires/csv', { responseType: 'blob' });
    telechargerFichier(res.data, 'accords-moratoires-dgi.csv', 'text/csv; charset=UTF-8');
  },

  // 4. Grand Livre PDF
  async telechargerGrandLivrePdf(dateArrete?: string): Promise<void> {
    const res = await apiClient.get('/rapports/grand-livre-pdf', {
      params: dateArrete ? { dateArrete } : {},
      responseType: 'blob',
    });
    telechargerFichier(res.data, `grand-livre-fiscal-${dateArrete || new Date().toISOString().split('T')[0]}.pdf`, 'application/pdf');
  },
};