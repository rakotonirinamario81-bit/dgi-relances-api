import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { scoringService } from '@/services/scoringService';
import type { ContribuableScoring, Recommandation, ScoringTableauBord } from '@/types/scoring.types';
import { Loader } from '@/components/common/Loader';
import { Modal } from '@/components/common/Modal';
import { formaterMontant } from '@/utils/formatDate';
import { ROUTES } from '@/routes/routesConfig';

// ── Helpers visuels ───────────────────────────────────────────────────────────
function badgeRisque(niveau: string) {
  switch (niveau) {
    case 'RISQUE_ELEVE':  return 'bg-red-100 text-red-800 border border-red-200';
    case 'RISQUE_MOYEN':  return 'bg-amber-100 text-amber-800 border border-amber-200';
    default:              return 'bg-green-100 text-green-700 border border-green-200';
  }
}

function labelRisque(niveau: string) {
  switch (niveau) {
    case 'RISQUE_ELEVE': return '🔴 Élevé';
    case 'RISQUE_MOYEN': return '🟡 Moyen';
    default:             return '🟢 Faible';
  }
}

function couleurScore(score: number) {
  if (score >= 65) return 'bg-red-500';
  if (score >= 35) return 'bg-amber-400';
  return 'bg-green-500';
}

function badgePriorite(priorite: string) {
  switch (priorite) {
    case 'URGENTE': return 'bg-red-100 text-red-700 border border-red-200 font-bold';
    case 'HAUTE':   return 'bg-orange-100 text-orange-700 border border-orange-200';
    default:        return 'bg-blue-100 text-blue-700 border border-blue-200';
  }
}

// ── Composant barre de score ──────────────────────────────────────────────────
function BarreScore({ score, max = 100 }: { score: number; max?: number }) {
  const pct = Math.min(100, Math.round((score / max) * 100));
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${couleurScore(score)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono font-semibold w-10 text-right">{score}/100</span>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export function ScoringRisquePage() {
  const [tableauBord, setTableauBord] = useState<ScoringTableauBord | null>(null);
  const [contribuables, setContribuables] = useState<ContribuableScoring[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [filtreNiveau, setFiltreNiveau] = useState('');
  const [page, setPage] = useState(0);
  const [rechercheTexte, setRechercheTexte] = useState('');

  // Modal recommandations
  const [detteSelectionnee, setDetteSelectionnee] = useState<ContribuableScoring | null>(null);
  const [recommandations, setRecommandations] = useState<Recommandation[]>([]);
  const [chargementRecs, setChargementRecs] = useState(false);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [tb, liste] = await Promise.all([
        scoringService.getTableauBord(),
        scoringService.listerContribuablesARisque(filtreNiveau || undefined, page, 25),
      ]);
      setTableauBord(tb);
      setContribuables(liste);
    } catch {
      setErreur('Erreur lors du chargement des données de scoring.');
    } finally {
      setChargement(false);
    }
  }, [filtreNiveau, page]);

  useEffect(() => { void charger(); }, [charger]);

  async function ouvrirRecommandations(c: ContribuableScoring) {
    setDetteSelectionnee(c);
    setChargementRecs(true);
    try {
      const recs = await scoringService.getRecommandations(c.detteId);
      setRecommandations(recs);
    } finally {
      setChargementRecs(false);
    }
  }

  const listeFiltree = contribuables.filter(c =>
    rechercheTexte === '' ||
    c.nif.toLowerCase().includes(rechercheTexte.toLowerCase()) ||
    c.nomContribuable.toLowerCase().includes(rechercheTexte.toLowerCase()) ||
    c.commune.toLowerCase().includes(rechercheTexte.toLowerCase())
  );

  // Données graphique camembert
  const dataCamembert = tableauBord ? [
    { name: 'Risque Élevé',  value: tableauBord.nbRisqueEleve,  color: '#ef4444' },
    { name: 'Risque Moyen',  value: tableauBord.nbRisqueMoyen,  color: '#f59e0b' },
    { name: 'Risque Faible', value: tableauBord.nbRisqueFaible, color: '#22c55e' },
  ].filter(d => d.value > 0) : [];

  if (chargement) return <Loader />;

  if (erreur) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="font-semibold">⚠️ {erreur}</p>
        <button onClick={() => void charger()} className="mt-3 text-sm underline">Réessayer</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl space-y-6">

      {/* ── En-tête ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>🤖</span> Scoring Prédictif & Intelligence Artificielle
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Analyse comportementale des contribuables basée sur 4 critères pondérés — score sur 100 points.
          </p>
        </div>
        <button
          onClick={() => void charger()}
          className="self-start sm:self-auto rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          🔄 Actualiser
        </button>
      </div>

      {/* ── KPI Cards ── */}
      {tableauBord && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-red-100 p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-red-500 mb-1">🔴 Risque Élevé</div>
            <div className="text-3xl font-extrabold text-red-700">{tableauBord.nbRisqueEleve}</div>
            <div className="text-sm text-red-600 mt-1">
              {formaterMontant(tableauBord.montantTotalRisqueEleve)} exposés
            </div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-500 mb-1">🟡 Risque Moyen</div>
            <div className="text-3xl font-extrabold text-amber-700">{tableauBord.nbRisqueMoyen}</div>
            <div className="text-sm text-amber-600 mt-1">
              {formaterMontant(tableauBord.montantTotalRisqueMoyen)} exposés
            </div>
          </div>
          <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-green-500 mb-1">🟢 Risque Faible</div>
            <div className="text-3xl font-extrabold text-green-700">{tableauBord.nbRisqueFaible}</div>
            <div className="text-sm text-green-600 mt-1">
              {formaterMontant(tableauBord.montantTotalRisqueFaible)} exposés
            </div>
          </div>
        </div>
      )}

      {/* ── Graphique + Explication des facteurs ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Camembert */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800 mb-3">Répartition par niveau de risque</h2>
          {dataCamembert.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={dataCamembert} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  paddingAngle={3} dataKey="value">
                  {dataCamembert.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: number) => [`${val} dettes`, '']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Aucune donnée disponible</p>
          )}
        </div>

        {/* Facteurs de scoring */}
        <div className="lg:col-span-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800 mb-3">📊 Les 4 facteurs du score de risque</h2>
          <div className="space-y-3">
            {[
              { label: 'Montant de la dette', max: 30, color: 'bg-fiscal-bordeaux',
                desc: '< 1 M Ar : 5 pts  |  1–5 M Ar : 18 pts  |  ≥ 5 M Ar : 30 pts' },
              { label: 'Durée du retard', max: 35, color: 'bg-red-500',
                desc: '< 7 j : 0 pt  |  7–14 j : 8 pts  |  15–29 j : 15 pts  |  30–59 j : 25 pts  |  ≥ 60 j : 35 pts' },
              { label: 'Historique contribuable', max: 20, color: 'bg-amber-500',
                desc: '0 relance reçue : 0 pt  |  1–4 : 5 pts  |  5–9 : 12 pts  |  ≥ 10 : 20 pts' },
              { label: 'Relances sur cette dette', max: 15, color: 'bg-orange-500',
                desc: '0 : 0 pt  |  1 : 3 pts  |  2–3 : 8 pts  |  ≥ 4 : 15 pts' },
            ].map(f => (
              <div key={f.label} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-700">{f.label}</span>
                  <span className="text-xs text-gray-400 font-mono">max {f.max} pts</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1">
                  <div className={`h-full rounded-full ${f.color}`} style={{ width: `${(f.max / 100) * 100}%` }} />
                </div>
                <p className="text-[10px] text-gray-400 leading-tight">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2 text-[11px] font-semibold">
            <span className="rounded-full bg-green-100 text-green-700 px-2 py-0.5">Score &lt; 35 → FAIBLE</span>
            <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5">35–64 → MOYEN</span>
            <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5">≥ 65 → ÉLEVÉ</span>
          </div>
        </div>
      </div>

      {/* ── Tableau des contribuables à risque ── */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">
            Contribuables analysés ({listeFiltree.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {/* Filtre niveau */}
            <select
              value={filtreNiveau}
              onChange={e => { setFiltreNiveau(e.target.value); setPage(0); }}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs focus:border-fiscal-bordeaux focus:ring-1 focus:ring-fiscal-bordeaux"
            >
              <option value="">Tous les niveaux</option>
              <option value="RISQUE_ELEVE">🔴 Risque Élevé</option>
              <option value="RISQUE_MOYEN">🟡 Risque Moyen</option>
              <option value="RISQUE_FAIBLE">🟢 Risque Faible</option>
            </select>
            {/* Recherche */}
            <input
              type="text"
              placeholder="NIF, Nom, Commune…"
              value={rechercheTexte}
              onChange={e => setRechercheTexte(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs w-48 focus:border-fiscal-bordeaux focus:ring-1 focus:ring-fiscal-bordeaux"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wide">
                <th className="px-4 py-3 text-left font-semibold">NIF / Contribuable</th>
                <th className="px-3 py-3 text-left font-semibold">Commune</th>
                <th className="px-3 py-3 text-left font-semibold">Impôt</th>
                <th className="px-3 py-3 text-right font-semibold">Solde Restant</th>
                <th className="px-3 py-3 text-right font-semibold">Retard</th>
                <th className="px-3 py-3 text-center font-semibold w-40">Score IA</th>
                <th className="px-3 py-3 text-center font-semibold">Niveau</th>
                <th className="px-3 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {listeFiltree.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    Aucun contribuable trouvé.
                  </td>
                </tr>
              ) : listeFiltree.map(c => (
                <tr key={c.detteId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900 truncate max-w-[160px]">{c.nomContribuable}</div>
                    <div className="font-mono text-gray-400 text-[10px]">{c.nif}</div>
                  </td>
                  <td className="px-3 py-3 text-gray-600">{c.commune}</td>
                  <td className="px-3 py-3">
                    <div className="text-gray-700 font-medium">{c.impot}</div>
                    <div className="text-gray-400 text-[10px]">{c.periode}</div>
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-red-700">
                    {formaterMontant(c.soldeRestant)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className={`font-semibold ${c.joursDeRetard >= 60 ? 'text-red-600' : c.joursDeRetard >= 30 ? 'text-amber-600' : 'text-gray-600'}`}>
                      {c.joursDeRetard} j
                    </span>
                  </td>
                  <td className="px-3 py-3 w-40">
                    <BarreScore score={c.scoreTotal} />
                    <div className="flex justify-between text-[9px] text-gray-400 mt-1 px-0.5">
                      <span>M:{c.scoreMontant}</span>
                      <span>R:{c.scoreRetard}</span>
                      <span>H:{c.scoreHistorique}</span>
                      <span>D:{c.scoreRelancesDette}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeRisque(c.niveauRisque)}`}>
                      {labelRisque(c.niveauRisque)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => void ouvrirRecommandations(c)}
                        className="rounded-md bg-fiscal-bordeaux/10 px-2 py-1 text-[10px] font-medium text-fiscal-bordeaux hover:bg-fiscal-bordeaux hover:text-white transition-colors"
                        title="Voir les recommandations IA"
                      >
                        💡 IA
                      </button>
                      <Link
                        to={ROUTES.RELANCES}
                        className="rounded-md bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-600 hover:bg-gray-200 transition-colors"
                        title="Aller aux relances"
                      >
                        📨
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-xs text-gray-500">
          <span>{contribuables.length} résultats (page {page + 1})</span>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Précédent
            </button>
            <button
              disabled={contribuables.length < 25}
              onClick={() => setPage(p => p + 1)}
              className="rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Suivant →
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal Recommandations IA ── */}
      {detteSelectionnee && (
        <Modal
          ouverte={true}
          titre={`💡 Recommandations IA — ${detteSelectionnee.nomContribuable}`}
          onFermer={() => setDetteSelectionnee(null)}
        >
          <div className="space-y-4">
            {/* Résumé de la dette */}
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-xs grid grid-cols-2 gap-2">
              <div><span className="text-gray-500">NIF :</span> <span className="font-mono font-semibold">{detteSelectionnee.nif}</span></div>
              <div><span className="text-gray-500">Score IA :</span> <span className="font-bold">{detteSelectionnee.scoreTotal}/100</span></div>
              <div><span className="text-gray-500">Solde restant :</span> <span className="font-semibold text-red-700">{formaterMontant(detteSelectionnee.soldeRestant)}</span></div>
              <div><span className="text-gray-500">Retard :</span> <span className="font-semibold">{detteSelectionnee.joursDeRetard} jours</span></div>
            </div>

            {/* Liste des recommandations */}
            {chargementRecs ? (
              <div className="py-8 text-center text-sm text-gray-400">Génération des recommandations...</div>
            ) : recommandations.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Aucune recommandation disponible.</p>
            ) : (
              <div className="space-y-3">
                {recommandations.map((r, i) => (
                  <div key={i} className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${badgePriorite(r.priorite)}`}>
                        {r.priorite}
                      </span>
                      <span className="text-[10px] text-gray-400 italic">⏱ {r.delaiSuggere}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">✅ {r.action}</p>
                    <p className="text-xs text-gray-500">{r.motif}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Link
                to={ROUTES.RELANCES}
                className="rounded-lg bg-fiscal-bordeaux px-4 py-2 text-sm font-semibold text-white hover:bg-fiscal-bordeauxFonce transition-colors"
              >
                🚀 Relancer maintenant
              </Link>
              <button
                onClick={() => setDetteSelectionnee(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Fermer
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
