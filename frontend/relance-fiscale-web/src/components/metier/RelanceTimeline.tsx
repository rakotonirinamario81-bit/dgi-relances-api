import type { Relance } from '@/types/relance.types';
import { formaterDateHeureFr } from '@/utils/formatDate';

const LIBELLE_NIVEAU: Record<string, { titre: string; badge: string; color: string; etape: string }> = {
  NIVEAU_0_PREVENTIF: {
    titre: 'Niveau 0 — Préventif',
    badge: 'Avis pré-échéance',
    color: 'bg-blue-50 text-blue-800 border-blue-200',
    etape: '0',
  },
  NIVEAU_1_AMIABLE: {
    titre: 'Niveau 1 — Amiable',
    badge: 'Rappel courtois (SMS)',
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    etape: '1',
  },
  NIVEAU_2_INTERMEDIAIRE: {
    titre: 'Niveau 2 — Sommation',
    badge: 'Mise en demeure (SMS + Email)',
    color: 'bg-amber-50 text-amber-800 border-amber-200',
    etape: '2',
  },
  NIVEAU_3_OFFICIEL: {
    titre: 'Niveau 3 — Titre Officiel',
    badge: 'Avis formel PDF certifié',
    color: 'bg-orange-50 text-orange-800 border-orange-200',
    etape: '3',
  },
  NIVEAU_4_FORCE: {
    titre: 'Niveau 4 — Recouvrement Forcé',
    badge: 'Poursuite & ATD légal',
    color: 'bg-red-50 text-red-800 border-red-200',
    etape: '4',
  },
};

export function RelanceTimeline({ relances }: { relances: Relance[] }) {
  if (relances.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/60 p-8 text-center">
        <span className="text-3xl block mb-2">📭</span>
        <h4 className="text-sm font-semibold text-gray-800">Aucune relance expédiée</h4>
        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
          Cette créance fiscale n'a pas encore fait l'objet de notification automatisée ou manuelle.
        </p>
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-fiscal-bordeaux before:via-gray-300 before:to-gray-200">
      {relances.map((relance, index) => {
        const niveauInfo = LIBELLE_NIVEAU[relance.niveauRelance] || {
          titre: relance.niveauRelance,
          badge: 'Notification',
          color: 'bg-gray-50 text-gray-800 border-gray-200',
          etape: '•',
        };

        const estEnvoye = relance.statutEnvoi === 'ENVOYE';
        const estEchec = relance.statutEnvoi === 'ECHEC';

        return (
          <div key={relance.id ?? index} className="relative group">
            {/* Pastille chronologique */}
            <div
              className={`absolute -left-6 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold shadow-sm transition-transform group-hover:scale-110 ${
                estEnvoye
                  ? 'border-emerald-500 bg-emerald-500 text-white ring-4 ring-emerald-50'
                  : estEchec
                  ? 'border-red-500 bg-red-500 text-white ring-4 ring-red-50'
                  : 'border-amber-400 bg-amber-400 text-white ring-4 ring-amber-50'
              }`}
            >
              {estEnvoye ? '✓' : estEchec ? '✕' : '⏳'}
            </div>

            {/* Carte de notification */}
            <div className="rounded-xl border border-gray-200/90 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${niveauInfo.color}`}
                  >
                    <span>Étape {niveauInfo.etape}</span>
                    <span>·</span>
                    <span>{niveauInfo.badge}</span>
                  </span>
                  <span className="text-xs font-bold text-gray-900">{niveauInfo.titre}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      estEnvoye
                        ? 'bg-emerald-100 text-emerald-800'
                        : estEchec
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {estEnvoye ? '✓ Acheminé' : estEchec ? '✕ Échec' : '⏳ En attente'}
                  </span>
                  <span className="text-[11px] font-mono text-gray-500">
                    {relance.dateEnvoi ? formaterDateHeureFr(relance.dateEnvoi) : 'Date indéterminée'}
                  </span>
                </div>
              </div>

              {/* Détails du canal et documents */}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="text-base">
                    {relance.canal === 'SMS_ET_EMAIL'
                      ? '📲'
                      : relance.canal === 'SMS'
                      ? '📱'
                      : '📧'}
                  </span>
                  <span>
                    Canal :{' '}
                    <strong className="text-gray-900">
                      {relance.canal === 'SMS_ET_EMAIL'
                        ? 'SMS & Courrier Électronique'
                        : relance.canal === 'SMS'
                        ? 'SMS Direct Mobile'
                        : 'Avis par Courrier Électronique'}
                    </strong>
                  </span>
                </div>

                {relance.documentPdfGenere && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-red-50 border border-red-200 px-2 py-1 text-[11px] font-semibold text-fiscal-bordeaux">
                    <span>📄</span>
                    <span>Avis officiel DGI scellé</span>
                  </span>
                )}
              </div>

              {/* Message d'échec si présent */}
              {estEchec && relance.motifEchec && (
                <div className="mt-2.5 rounded-lg border border-red-200 bg-red-50/70 p-2.5 text-xs text-red-800 flex items-start gap-2">
                  <span className="text-sm">⚠️</span>
                  <div>
                    <span className="font-semibold block">Incident d'acheminement :</span>
                    <span className="text-red-700">{relance.motifEchec}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}