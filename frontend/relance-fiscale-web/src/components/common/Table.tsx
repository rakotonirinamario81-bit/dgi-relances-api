import type { ReactNode } from 'react';

export interface ColonneTable<T> {
  cle: string;
  entete: string;
  rendu: (ligne: T) => ReactNode;
  alignementDroite?: boolean;
}

interface TableProps<T> {
  colonnes: ColonneTable<T>[];
  donnees: T[];
  cleLigne: (ligne: T) => string | number;
  chargement?: boolean;
  messageVide?: string;
  onLigneClick?: (ligne: T) => void;
}

export function Table<T>({
  colonnes,
  donnees,
  cleLigne,
  chargement,
  messageVide = 'Aucune donnée',
  onLigneClick,
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200/90 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-slate-50/90">
          <tr>
            {colonnes.map((col) => (
              <th
                key={col.cle}
                scope="col"
                className={`px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 ${
                  col.alignementDroite ? 'text-right' : 'text-left'
                }`}
              >
                {col.entete}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {chargement ? (
            <tr>
              <td colSpan={colonnes.length} className="px-4 py-12 text-center">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="h-7 w-7 animate-spin rounded-full border-2 border-fiscal-bordeaux border-t-transparent" />
                  <span className="text-xs text-gray-500 font-medium">Chargement des données…</span>
                </div>
              </td>
            </tr>
          ) : donnees.length === 0 ? (
            <tr>
              <td colSpan={colonnes.length} className="px-4 py-12 text-center">
                <div className="flex flex-col items-center justify-center gap-1.5 text-gray-400">
                  <span className="text-3xl">📂</span>
                  <span className="text-sm font-medium text-gray-600 mt-1">{messageVide}</span>
                  <span className="text-xs text-gray-400">Aucun enregistrement ne correspond aux critères.</span>
                </div>
              </td>
            </tr>
          ) : (
            donnees.map((ligne) => (
              <tr
                key={cleLigne(ligne)}
                onClick={() => onLigneClick?.(ligne)}
                className={`transition-colors hover:bg-slate-50/80 ${
                  onLigneClick ? 'cursor-pointer' : ''
                }`}
              >
                {colonnes.map((col) => (
                  <td
                    key={col.cle}
                    className={`px-4 py-3.5 text-gray-700 align-middle ${
                      col.alignementDroite ? 'text-right' : 'text-left'
                    }`}
                  >
                    {col.rendu(ligne)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}