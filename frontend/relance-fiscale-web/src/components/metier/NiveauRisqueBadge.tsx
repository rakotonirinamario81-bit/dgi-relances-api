import { Badge } from '@/components/common/Badge';
import type { NiveauRisque } from '@/types/detteFiscale.types';

const CONFIG_RISQUE: Record<NiveauRisque, { libelle: string; couleur: 'vert' | 'orange' | 'rouge' }> = {
  RISQUE_FAIBLE: { libelle: 'Risque faible', couleur: 'vert' },
  RISQUE_MOYEN: { libelle: 'Risque moyen', couleur: 'orange' },
  RISQUE_ELEVE: { libelle: 'Risque élevé', couleur: 'rouge' },
};

export function NiveauRisqueBadge({ niveau }: { niveau: NiveauRisque | null }) {
  if (!niveau) return <span className="text-xs text-gray-400">Non évalué</span>;
  const config = CONFIG_RISQUE[niveau];
  return <Badge couleur={config.couleur}>{config.libelle}</Badge>;
}