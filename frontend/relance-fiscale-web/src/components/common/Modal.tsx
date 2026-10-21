import { useEffect, type ReactNode } from 'react';
import clsx from 'clsx';

interface ModalProps {
  ouverte: boolean;
  titre: string;
  sousTitre?: string;
  icone?: ReactNode;
  onFermer: () => void;
  children: ReactNode;
  pied?: ReactNode;
  taille?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

const TAILLES_CLASSES: Record<NonNullable<ModalProps['taille']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
};

export function Modal({
  ouverte,
  titre,
  sousTitre,
  icone,
  onFermer,
  children,
  pied,
  taille = 'lg',
}: ModalProps) {
  // Fermeture par la touche Échap
  useEffect(() => {
    if (!ouverte) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onFermer();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ouverte, onFermer]);

  if (!ouverte) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-sm transition-opacity duration-200 animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={clsx(
          'relative flex w-full flex-col rounded-2xl bg-white shadow-2xl border border-gray-100 max-h-[92vh] overflow-hidden transition-all duration-200 animate-scaleUp',
          TAILLES_CLASSES[taille]
        )}
      >
        {/* En-tête */}
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4 sm:px-6 bg-gradient-to-r from-gray-50/80 to-white">
          <div className="flex items-start gap-3">
            {icone && (
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-fiscal-bordeaux/10 text-fiscal-bordeaux text-lg shadow-sm">
                {icone}
              </div>
            )}
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                {titre}
              </h3>
              {sousTitre && (
                <p className="mt-0.5 text-xs text-gray-500 font-normal">
                  {sousTitre}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onFermer}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Fermer la boîte de dialogue"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Corps déroulant */}
        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6 space-y-4">
          {children}
        </div>

        {/* Pied de page */}
        {pied && (
          <div className="flex items-center justify-end gap-2.5 border-t border-gray-100 bg-gray-50/80 px-5 py-3.5 sm:px-6 shrink-0">
            {pied}
          </div>
        )}
      </div>
    </div>
  );
}