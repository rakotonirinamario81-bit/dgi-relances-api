import type { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

type Variante = 'primaire' | 'secondaire' | 'danger' | 'fantome';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  enCours?: boolean;
  children: ReactNode;
}

const STYLES_VARIANTE: Record<Variante, string> = {
  primaire: 'bg-fiscal-bordeaux text-white hover:bg-fiscal-bordeauxFonce',
  secondaire: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  fantome: 'bg-transparent text-fiscal-bordeaux hover:bg-fiscal-bordeaux/10',
};

export function Button({ variante = 'primaire', enCours = false, disabled, children, className, ...rest }: ButtonProps) {
  return (
    <button
      disabled={disabled || enCours}
      className={clsx(
        'rounded px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        STYLES_VARIANTE[variante],
        className
      )}
      {...rest}
    >
      {enCours ? 'Veuillez patienter...' : children}
    </button>
  );
}