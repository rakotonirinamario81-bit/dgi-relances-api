import { Link } from 'react-router-dom';
import type { Contribuable } from '@/types/contribuable.types';
import { Button } from '@/components/common/Button';

interface ContribuableCardProps {
  contribuable: Contribuable;
  onModifier?: (contribuable: Contribuable) => void;
  onSupprimer?: (contribuable: Contribuable) => void;
}

export function ContribuableCard({ contribuable, onModifier, onSupprimer }: ContribuableCardProps) {
  return (
    <div className="rounded border border-gray-200 p-4 hover:border-fiscal-bordeaux hover:shadow-sm transition">
      <Link to={`/contribuables/${contribuable.id}`} className="block">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="font-medium text-gray-900">{contribuable.nomAffichage}</p>
            <p className="text-sm text-gray-500">NIF : {contribuable.nif}</p>
            {contribuable.commune && <p className="text-xs text-gray-400">{contribuable.commune}</p>}
          </div>
          {contribuable.nombreDettesActives > 0 && (
            <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 whitespace-nowrap">
              {contribuable.nombreDettesActives} dette(s) active(s)
            </span>
          )}
        </div>
      </Link>

      {(onModifier || onSupprimer) && (
        <div className="mt-3 flex justify-end gap-2 border-t border-gray-100 pt-3">
          {onModifier && (
            <Button
              type="button"
              variante="secondaire"
              className="!px-3 !py-1.5 text-xs"
              onClick={() => onModifier(contribuable)}
            >
              Modifier
            </Button>
          )}
          {onSupprimer && (
            <Button
              type="button"
              variante="danger"
              className="!px-3 !py-1.5 text-xs"
              onClick={() => onSupprimer(contribuable)}
            >
              Supprimer
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
