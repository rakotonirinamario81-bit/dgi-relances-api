import type { ReactNode } from 'react';
import clsx from 'clsx';

type Couleur = 'vert' | 'orange' | 'rouge' | 'gris' | 'bleu';

interface BadgeProps {
  couleur: Couleur;
  children: ReactNode;
}

const STYLES_COULEUR: Record<Couleur, string> = {
  vert: 'bg-green-100 text-green-800',
  orange: 'bg-amber-100 text-amber-800',
  rouge: 'bg-red-100 text-red-800',
  gris: 'bg-gray-100 text-gray-700',
  bleu: 'bg-blue-100 text-blue-800',
};

export function Badge({ couleur, children }: BadgeProps) {
  return (
    <span className={clsx('inline-block rounded-full px-2.5 py-0.5 text-xs font-medium', STYLES_COULEUR[couleur])}>
      {children}
    </span>
  );
}