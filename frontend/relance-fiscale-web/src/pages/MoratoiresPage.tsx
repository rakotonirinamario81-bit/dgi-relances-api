import { PaiementsPage } from './PaiementsPage';

/**
 * Page Moratoires intégrée : redirige vers l'expérience unifiée des Encaissements
 * & Moratoires dans PaiementsPage avec l'onglet Moratoires actif par défaut.
 */
export function MoratoiresPage() {
  return <PaiementsPage ongletInitial="MORATOIRES" modaliteInitiale="MORATOIRE" />;
}
