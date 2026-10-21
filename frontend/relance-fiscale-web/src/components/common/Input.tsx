import type { InputHTMLAttributes } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  erreur?: string;
}

export function Input({ label, erreur, className, id, disabled, ...rest }: InputProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        id={id}
        disabled={disabled}
        className={clsx(
          'w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-fiscal-bordeaux',
          erreur ? 'border-red-500' : 'border-gray-300',
          disabled && 'bg-gray-100 text-gray-500 cursor-not-allowed',
          className
        )}
        {...rest}
      />
      {erreur && <p className="mt-1 text-xs text-red-600">{erreur}</p>}
    </div>
  );
}