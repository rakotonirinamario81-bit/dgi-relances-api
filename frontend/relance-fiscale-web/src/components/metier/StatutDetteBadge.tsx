import { Badge } from '@/components/common/Badge';
import type { StatutDette } from '@/types/detteFiscale.types';

const CONFIG_STATUT: Record<StatutDette, { libelle: string; couleur: 'vert' | 'orange' | 'rouge' | 'gris' | 'bleu' }> = {
  A_PAYER: { libelle: 'À payer', couleur: 'bleu' },
  PAYE: { libelle: 'Payé', couleur: 'vert' },
  EN_RETARD: { libelle: 'En retard', couleur: 'orange' },
  EN_RELANCE: { libelle: 'En relance', couleur: 'orange' },
  EN_PROCEDURE_RECOUVREMENT: { libelle: 'Recouvrement forcé', couleur: 'rouge' },
  CLOTURE: { libelle: 'Clôturé', couleur: 'gris' },
};

export function StatutDetteBadge({ statut }: { statut: StatutDette }) {
  const config = CONFIG_STATUT[statut];
  return <Badge couleur={config.couleur}>{config.libelle}</Badge>;
}