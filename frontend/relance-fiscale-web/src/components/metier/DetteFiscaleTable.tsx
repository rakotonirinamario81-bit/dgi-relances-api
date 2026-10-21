import { Table, type ColonneTable } from '@/components/common/Table';
import { StatutDetteBadge } from './StatutDetteBadge';
import { NiveauRisqueBadge } from './NiveauRisqueBadge';
import type { DetteFiscale } from '@/types/detteFiscale.types';
import { formaterMontant, formaterDateFr } from '@/utils/formatDate';

interface DetteFiscaleTableProps {
  dettes: DetteFiscale[];
  chargement?: boolean;
  messageVide?: string;
  onSelectionner?: (dette: DetteFiscale) => void;
  onModifier?: (dette: DetteFiscale) => void;
  onSupprimer?: (dette: DetteFiscale) => void;
  onCalculerPenalites?: (dette: DetteFiscale) => void;
  modeVue?: 'table' | 'cartes';
}

function getInitiales(nom: string): string {
  if (!nom) return 'CF';
  const parts = nom.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function DetteFiscaleTable({
  dettes,
  chargement,
  messageVide,
  onModifier,
  onSupprimer,
  onCalculerPenalites,
  modeVue = 'table',
}: DetteFiscaleTableProps) {
  const avecActions = Boolean(onModifier || onSupprimer || onCalculerPenalites);

  // Vue Cartes (idéale pour mobile ou affichage responsive)
  if (modeVue === 'cartes' && !chargement && dettes.length > 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {dettes.map((d) => {
          const totalExigible = d.soldeRestant ?? d.montantDu;
          const aDesPenalites = (d.penalitesRetard && d.penalitesRetard > 0) || (d.interetsRetard && d.interetsRetard > 0);
          const montantPenalites = (d.penalitesRetard || 0) + (d.interetsRetard || 0) - (d.remiseGracieuse || 0);

          return (
            <div
              key={d.id}
              className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
            >
              {/* Indicateur de statut en bordure supérieure */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 ${
                  d.joursDeRetard > 0 ? 'bg-red-500' : d.statut === 'PAYE' ? 'bg-green-500' : 'bg-fiscal-bordeaux'
                }`}
              />

              <div>
                {/* En-tête contribuable & badges */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fiscal-bordeaux/10 text-fiscal-bordeaux font-bold text-xs">
                      {getInitiales(d.nomContribuable)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 leading-tight">
                        {d.nomContribuable}
                      </h4>
                      <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                        Réf: DETTE-{d.id}
                      </p>
                    </div>
                  </div>
                  <StatutDetteBadge statut={d.statut} />
                </div>

                {/* Détails fiscaux */}
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-50/80 p-2.5 text-xs mb-3">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">Nature Impôt</span>
                    <span className="font-semibold text-gray-800">{d.impot}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">Période</span>
                    <span className="font-mono font-medium text-gray-700">{d.periodeFiscale}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">Échéance</span>
                    <span className="text-gray-700">{formaterDateFr(d.dateEcheance)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">Retard</span>
                    {d.joursDeRetard > 0 ? (
                      <span className="font-bold text-red-600">⚠️ {d.joursDeRetard} jours</span>
                    ) : (
                      <span className="text-green-600 font-medium">À jour</span>
                    )}
                  </div>
                </div>

                {/* Montant & Pénalités */}
                <div className="mb-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-gray-500 font-medium">Solde exigible :</span>
                    <span className="text-base font-extrabold text-gray-900">
                      {formaterMontant(totalExigible)}
                    </span>
                  </div>
                  {aDesPenalites && (
                    <div className="flex items-center justify-between text-[11px] text-red-600 font-medium mt-0.5">
                      <span>Dont pénalités CGI :</span>
                      <span>+{formaterMontant(montantPenalites)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <span className="text-[11px] text-gray-500">Niveau de risque :</span>
                    <NiveauRisqueBadge niveau={d.niveauRisque} />
                  </div>
                </div>
              </div>

              {/* Actions */}
              {avecActions && (
                <div className="flex items-center gap-1.5 pt-3 border-t border-gray-100 flex-wrap justify-end">
                  {onCalculerPenalites && d.joursDeRetard > 0 && d.statut !== 'CLOTURE' && (
                    <button
                      type="button"
                      onClick={() => onCalculerPenalites(d)}
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors shadow-xs"
                      title="Calculer les pénalités et intérêts de retard (CGI)"
                    >
                      <span>⚖️</span> Pénalités CGI
                    </button>
                  )}
                  {onModifier && (
                    <button
                      type="button"
                      onClick={() => onModifier(d)}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-fiscal-bordeaux transition-colors shadow-xs"
                    >
                      <span>✏️</span> Modifier
                    </button>
                  )}
                  {onSupprimer && (
                    <button
                      type="button"
                      onClick={() => onSupprimer(d)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50/50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors shadow-xs"
                    >
                      <span>🗑️</span> Supprimer
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Vue Tableau (Desktop / Tablette)
  const colonnes: ColonneTable<DetteFiscale>[] = [
    {
      cle: 'contribuable',
      entete: 'Contribuable',
      rendu: (d) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-fiscal-bordeaux/10 text-fiscal-bordeaux font-bold text-xs shadow-xs">
            {getInitiales(d.nomContribuable)}
          </div>
          <div>
            <div className="font-semibold text-gray-900 leading-snug">
              {d.nomContribuable}
            </div>
            <div className="text-[10px] text-gray-400 font-mono">
              Réf #{d.id}
            </div>
          </div>
        </div>
      ),
    },
    {
      cle: 'impot',
      entete: 'Nature d’impôt',
      rendu: (d) => (
        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
          {d.impot}
        </span>
      ),
    },
    {
      cle: 'periode',
      entete: 'Période',
      rendu: (d) => (
        <span className="font-mono text-xs font-medium text-gray-700 bg-gray-50 px-2 py-0.5 rounded border border-gray-200/70">
          {d.periodeFiscale}
        </span>
      ),
    },
    {
      cle: 'solde',
      entete: 'Solde exigible',
      rendu: (d) => {
        const montantPenalites = (d.penalitesRetard || 0) + (d.interetsRetard || 0) - (d.remiseGracieuse || 0);
        return (
          <div>
            <div className="font-extrabold text-gray-900 font-mono text-sm">
              {formaterMontant(d.soldeRestant)}
            </div>
            {(d.penalitesRetard && d.penalitesRetard > 0) || (d.interetsRetard && d.interetsRetard > 0) ? (
              <div className="text-[10px] text-red-600 font-semibold mt-0.5 whitespace-nowrap">
                dont pénalités: {formaterMontant(montantPenalites)}
              </div>
            ) : null}
          </div>
        );
      },
      alignementDroite: true,
    },
    {
      cle: 'echeance',
      entete: 'Échéance',
      rendu: (d) => (
        <span className="text-xs text-gray-600 whitespace-nowrap">
          {formaterDateFr(d.dateEcheance)}
        </span>
      ),
    },
    {
      cle: 'retard',
      entete: 'Retard',
      rendu: (d) => (
        d.joursDeRetard > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-xs font-bold text-red-700">
            <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
            {d.joursDeRetard} j
          </span>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        )
      ),
      alignementDroite: true,
    },
    {
      cle: 'statut',
      entete: 'Statut',
      rendu: (d) => <StatutDetteBadge statut={d.statut} />,
    },
    {
      cle: 'risque',
      entete: 'Risque IA',
      rendu: (d) => <NiveauRisqueBadge niveau={d.niveauRisque} />,
    },
    ...(avecActions
      ? [
          {
            cle: 'actions' as const,
            entete: 'Actions',
            rendu: (d: DetteFiscale) => (
              <div className="flex items-center gap-1.5 justify-end">
                {onCalculerPenalites && d.joursDeRetard > 0 && d.statut !== 'CLOTURE' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCalculerPenalites(d);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors shadow-xs"
                    title="Calculer les pénalités et intérêts de retard (CGI)"
                  >
                    <span>⚖️</span>
                    <span className="hidden xl:inline">Pénalités</span> CGI
                  </button>
                )}
                {onModifier && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onModifier(d);
                    }}
                    className="rounded-lg border border-gray-200 bg-white p-1 text-gray-600 hover:border-gray-300 hover:text-fiscal-bordeaux hover:bg-gray-50 transition-colors shadow-xs"
                    title="Modifier la dette"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
                {onSupprimer && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSupprimer(d);
                    }}
                    className="rounded-lg border border-red-200 bg-white p-1 text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors shadow-xs"
                    title="Supprimer la dette"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ),
            alignementDroite: true,
          },
        ]
      : []),
  ];

  return (
    <Table
      colonnes={colonnes}
      donnees={dettes}
      cleLigne={(d) => d.id}
      chargement={chargement}
      messageVide={messageVide ?? 'Aucune dette fiscale trouvée'}
    />
  );
}