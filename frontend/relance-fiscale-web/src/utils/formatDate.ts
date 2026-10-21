export function formaterDateFr(dateIso: string): string {
  const date = new Date(dateIso);
  return date.toLocaleDateString('fr-FR');
}

export function formaterDateHeureFr(dateIso: string): string {
  const date = new Date(dateIso);
  return date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function formaterMontant(montant: number): string {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(montant) + ' Ar';
}
