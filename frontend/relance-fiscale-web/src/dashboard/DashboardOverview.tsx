import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { statistiqueService } from '@/services/statistiqueService';
import { scoringService } from '@/services/scoringService';
import { detteFiscaleService } from '@/services/detteFiscaleService';
import type { ScoringTableauBord } from '@/types/scoring.types';
import type { DetteFiscale } from '@/types/detteFiscale.types';
import { Loader } from '@/components/common/Loader';
import { KpiCards } from './KpiCards';
import { PerformanceAgentChart } from './PerformanceAgentChart';
import { formaterMontant } from '@/utils/formatDate';
import { ROUTES } from '@/routes/routesConfig';

const COULEURS_IMPOTS = ['#7a1e1e', '#c9a227', '#2563eb', '#10b981', '#8b5cf6', '#d97706'];

export function DashboardOverview() {
  const { stats, chargement: chargementStats, erreur, recharger } = useDashboardStats();

  // Données complémentaires
  const [evolutionData, setEvolutionData] = useState<{ mois: string; montant: number }[]>([]);
  const [impotData, setImpotData] = useState<{ nom: string; valeur: number }[]>([]);
  const [scoringData, setScoringData] = useState<ScoringTableauBord | null>(null);
  const [dettesCritiques, setDettesCritiques] = useState<DetteFiscale[]>([]);

  const chargerDonneesAvancees = useCallback(async () => {
    try {
      const [evolutionRes, impotRes, scoringRes, dettesRes] = await Promise.allSettled([
        statistiqueService.evolutionMensuelle(),
        statistiqueService.repartitionParImpot(),
        scoringService.getTableauBord(),
        detteFiscaleService.listerToutes(),
      ]);

      if (evolutionRes.status === 'fulfilled' && evolutionRes.value) {
        const evoFormatted = Object.entries(evolutionRes.value)
          .map(([mois, montant]) => ({ mois, montant: Number(montant) || 0 }))
          .sort((a, b) => a.mois.localeCompare(b.mois));
        setEvolutionData(evoFormatted);
      }

      if (impotRes.status === 'fulfilled' && impotRes.value) {
        const impFormatted = Object.entries(impotRes.value)
          .map(([nom, valeur]) => ({ nom, valeur: Number(valeur) || 0 }))
          .filter((i) => i.valeur > 0)
          .sort((a, b) => b.valeur - a.valeur);
        setImpotData(impFormatted);
      }

      if (scoringRes.status === 'fulfilled') {
        setScoringData(scoringRes.value);
      }

      if (dettesRes.status === 'fulfilled' && Array.isArray(dettesRes.value)) {
        // Filtrer les 5 dettes non soldées ayant le plus de retard
        const critiques = dettesRes.value
          .filter((d) => d.joursDeRetard > 0 && d.statut !== 'PAYE' && d.statut !== 'CLOTURE')
          .sort((a, b) => b.joursDeRetard - a.joursDeRetard)
          .slice(0, 5);
        setDettesCritiques(critiques);
      }
    } catch (err) {
      console.error('Erreur chargement données avancées dashboard:', err);
    }
  }, []);

  useEffect(() => {
    void chargerDonneesAvancees();
  }, [chargerDonneesAvancees]);

  const rafraichirTout = () => {
    void recharger();
    void chargerDonneesAvancees();
  };

  // Date actuelle en français
  const dateFormatee = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  if (chargementStats && !stats) return <Loader />;

  if (erreur) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/80 p-6 text-red-800">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-bold text-base">Erreur de chargement du tableau de bord</h3>
            <p className="text-sm mt-0.5">{erreur}</p>
          </div>
        </div>
        <button
          onClick={rafraichirTout}
          className="mt-4 rounded-xl bg-red-700 px-4 py-2 text-xs font-bold text-white hover:bg-red-800 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">

      {/* ------------------------------------------------------------------- */}
      {/* 1. En-tête Institutionnel & Barre d'Actions Rapides                */}
      {/* ------------------------------------------------------------------- */}
      <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-900 via-fiscal-bordeaux to-fiscal-bordeauxFonce p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        {/* Décoration en arrière-plan */}
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none text-9xl">
          🏛️
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-0.5 text-xs font-semibold backdrop-blur-xs text-amber-300">
                <span>🇲🇬</span> Direction Générale des Impôts
              </span>
              <span className="text-xs text-white/60 capitalize">
                • {dateFormatee}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Tableau de Bord Exécutif & Pilotage Fiscal
            </h1>
            <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-2xl">
              Suivi consolidé du recouvrement forcé et amiable, liquidation des créances et analyse prédictive du risque.
            </p>
          </div>

          {/* Raccourcis d'actions rapides */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={ROUTES.RELANCES}
              className="inline-flex items-center gap-1.5 rounded-xl bg-fiscal-or hover:bg-amber-500 text-slate-900 font-bold px-3.5 py-2 text-xs shadow-xs transition-colors"
            >
              <span>📨</span> Lancer Relances
            </Link>
            <Link
              to={ROUTES.DETTES_FISCALES}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-medium px-3.5 py-2 text-xs backdrop-blur-xs transition-colors"
            >
              <span>📜</span> Créer Dette
            </Link>
            <Link
              to={ROUTES.CARTOGRAPHIE}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-medium px-3.5 py-2 text-xs backdrop-blur-xs transition-colors"
            >
              <span>🗺️</span> Carte SIG
            </Link>
            <button
              type="button"
              onClick={rafraichirTout}
              className="inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white p-2 text-xs backdrop-blur-xs transition-colors"
              title="Rafraîchir les métriques"
            >
              🔄
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 2. Cartes KPIs Exécutives Modernisées                              */}
      {/* ------------------------------------------------------------------- */}
      {stats && <KpiCards stats={stats.statistiquesGlobales} />}

      {/* ------------------------------------------------------------------- */}
      {/* 3. Grille Graphique Décisionnelle (4 volets équilibrés)            */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Graphique 1 : Évolution Mensuelle du Recouvrement */}
        <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <span>📈</span> Évolution Mensuelle des Recouvrements
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Paiements réels encaissés mois par mois en Ariary
              </p>
            </div>
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 font-mono">
              Encaissé
            </span>
          </div>

          {evolutionData.length === 0 ? (
            <div className="flex h-56 flex-col items-center justify-center text-center text-gray-400">
              <span className="text-3xl mb-1">📊</span>
              <p className="text-xs">Aucun encaissement historique enregistré pour le moment.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={evolutionData} margin={{ top: 10, right: 15, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradientRecouvrement" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7a1e1e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#7a1e1e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                  }}
                  formatter={(val: number) => [formaterMontant(val), 'Recouvrement réel']}
                  labelFormatter={(m) => `Période : ${m}`}
                />
                <Area
                  type="monotone"
                  dataKey="montant"
                  name="Montant recouvré"
                  stroke="#7a1e1e"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#gradientRecouvrement)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Graphique 2 : Répartition par Nature d'Impôt */}
        <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <span>🥧</span> Répartition des Créances par Nature d'Impôt
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Ventilation de l'assiette des impayés (TVA, TPU, TF, IR...)
              </p>
            </div>
            <Link
              to={ROUTES.STATISTIQUES}
              className="text-xs text-fiscal-bordeaux font-semibold hover:underline"
            >
              Détails →
            </Link>
          </div>

          {impotData.length === 0 ? (
            <div className="flex h-56 flex-col items-center justify-center text-center text-gray-400">
              <span className="text-3xl mb-1">⚖️</span>
              <p className="text-xs">Aucune dette fiscale ventilée disponible.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-3">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={impotData}
                    dataKey="valeur"
                    nameKey="nom"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {impotData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COULEURS_IMPOTS[index % COULEURS_IMPOTS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => [formaterMontant(val), 'Solde restant']} />
                </PieChart>
              </ResponsiveContainer>

              {/* Légende détaillée avec montants */}
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {impotData.map((item, index) => (
                  <div key={item.nom} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: COULEURS_IMPOTS[index % COULEURS_IMPOTS.length] }}
                      />
                      <span className="font-medium text-gray-700 truncate">{item.nom}</span>
                    </div>
                    <span className="font-mono font-bold text-gray-900 shrink-0 ml-2">
                      {formaterMontant(item.valeur)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Graphique 3 : Pyramide du Risque Fiscal (IA Scoring) */}
        <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <span>🤖</span> Détection Prédictive du Risque Fiscal (IA)
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Classification automatique selon ponctualité, volume et récidive
              </p>
            </div>
            <Link
              to={ROUTES.SCORING_RISQUE}
              className="text-xs text-fiscal-bordeaux font-semibold hover:underline"
            >
              Module IA →
            </Link>
          </div>

          {scoringData ? (
            <div className="space-y-3.5">
              <div className="grid grid-cols-3 gap-2">
                {/* Élevé */}
                <div className="rounded-xl border border-red-200 bg-red-50/70 p-3 text-center">
                  <span className="text-[10px] font-bold text-red-600 uppercase block">🔴 Élevé</span>
                  <span className="text-xl font-black text-red-800 font-mono">
                    {scoringData.nbRisqueEleve}
                  </span>
                  <span className="text-[10px] text-red-700 block mt-0.5 font-medium truncate">
                    {formaterMontant(scoringData.montantTotalRisqueEleve)}
                  </span>
                </div>
                {/* Moyen */}
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-center">
                  <span className="text-[10px] font-bold text-amber-700 uppercase block">🟡 Modéré</span>
                  <span className="text-xl font-black text-amber-800 font-mono">
                    {scoringData.nbRisqueMoyen}
                  </span>
                  <span className="text-[10px] text-amber-700 block mt-0.5 font-medium truncate">
                    {formaterMontant(scoringData.montantTotalRisqueMoyen)}
                  </span>
                </div>
                {/* Faible */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-center">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase block">🟢 Faible</span>
                  <span className="text-xl font-black text-emerald-800 font-mono">
                    {scoringData.nbRisqueFaible}
                  </span>
                  <span className="text-[10px] text-emerald-700 block mt-0.5 font-medium truncate">
                    {formaterMontant(scoringData.montantTotalRisqueFaible)}
                  </span>
                </div>
              </div>

              {/* Jauge globale de conformité */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Portefeuille sécurisé</span>
                  <span className="font-bold text-emerald-700">
                    {scoringData.totalDettes > 0
                      ? `${Math.round((scoringData.nbRisqueFaible / scoringData.totalDettes) * 100)}% sain`
                      : '100%'}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 flex">
                  <div
                    className="bg-emerald-500 transition-all"
                    style={{
                      width: `${scoringData.totalDettes > 0 ? (scoringData.nbRisqueFaible / scoringData.totalDettes) * 100 : 0}%`,
                    }}
                    title="Risque Faible"
                  />
                  <div
                    className="bg-amber-400 transition-all"
                    style={{
                      width: `${scoringData.totalDettes > 0 ? (scoringData.nbRisqueMoyen / scoringData.totalDettes) * 100 : 0}%`,
                    }}
                    title="Risque Moyen"
                  />
                  <div
                    className="bg-red-500 transition-all"
                    style={{
                      width: `${scoringData.totalDettes > 0 ? (scoringData.nbRisqueEleve / scoringData.totalDettes) * 100 : 0}%`,
                    }}
                    title="Risque Élevé"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-44 flex-col items-center justify-center text-center text-gray-400">
              <span className="text-2xl mb-1">🤖</span>
              <p className="text-xs">Chargement du diagnostic de risque…</p>
            </div>
          )}
        </div>

        {/* Graphique 4 : Activité & Performance des Agents */}
        <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <span>👤</span> Performance des Agents de Recouvrement
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Volume de notifications et relances émises par gestionnaire
              </p>
            </div>
            <Link
              to={ROUTES.UTILISATEURS}
              className="text-xs text-fiscal-bordeaux font-semibold hover:underline"
            >
              Équipe →
            </Link>
          </div>

          {stats && <PerformanceAgentChart classement={stats.classementAgents} />}
        </div>

      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 4. Section Dossiers Prioritaires & Alertes Immédiates               */}
      {/* ------------------------------------------------------------------- */}
      <div className="rounded-2xl border border-gray-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span>🚨</span> Dossiers Fiscaux Prioritaires (Retards Critiques)
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Créances ayant le plus fort dépassement d'échéance nécessitant une mise en demeure immédiate
            </p>
          </div>
          <Link
            to={ROUTES.DETTES_FISCALES}
            className="self-start sm:self-auto rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs"
          >
            Voir toutes les dettes ({stats?.statistiquesGlobales.nombreTotalDebiteurs || 0}) →
          </Link>
        </div>

        {dettesCritiques.length === 0 ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-6 text-center">
            <span className="text-3xl">🎉</span>
            <h4 className="font-bold text-sm text-emerald-900 mt-1">
              Aucune créance en retard critique
            </h4>
            <p className="text-xs text-emerald-700 mt-0.5">
              Toutes les échéances fiscales sont à jour ou régularisées.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 uppercase text-[10px] tracking-wider text-left border-y border-slate-100">
                  <th className="px-4 py-2.5 font-bold">Contribuable</th>
                  <th className="px-3 py-2.5 font-bold">Nature Impôt</th>
                  <th className="px-3 py-2.5 font-bold">Période</th>
                  <th className="px-3 py-2.5 font-bold text-right">Solde Dû</th>
                  <th className="px-3 py-2.5 font-bold text-center">Retard</th>
                  <th className="px-3 py-2.5 font-bold text-center">Statut</th>
                  <th className="px-4 py-2.5 font-bold text-right">Action Directe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dettesCritiques.map((dette) => (
                  <tr key={dette.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {dette.nomContribuable}
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                        {dette.impot}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono text-gray-600">
                      {dette.periodeFiscale}
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-red-700 font-mono">
                      {formaterMontant(dette.soldeRestant)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 font-bold text-red-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
                        {dette.joursDeRetard} jours
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                        {dette.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={ROUTES.RELANCES}
                        className="inline-flex items-center gap-1 rounded-lg bg-fiscal-bordeaux hover:bg-fiscal-bordeauxFonce px-3 py-1 font-bold text-white shadow-2xs transition-colors"
                      >
                        <span>📨</span> Relancer
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 5. Raccourcis Stratégiques vers les Modules Avancés                */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to={ROUTES.CARTOGRAPHIE}
          className="group rounded-2xl border border-gray-200/90 bg-white p-4.5 shadow-xs hover:border-fiscal-bordeaux/40 hover:shadow-md transition-all flex items-start gap-3.5"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 text-xl group-hover:scale-105 transition-transform">
            🗺️
          </div>
          <div>
            <h4 className="font-bold text-sm text-gray-900 group-hover:text-fiscal-bordeaux transition-colors">
              Cartographie SIG
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Carte thermique interactive des 19 régions de Madagascar et géo-localisation des impayés.
            </p>
          </div>
        </Link>

        <Link
          to={ROUTES.SCORING_RISQUE}
          className="group rounded-2xl border border-gray-200/90 bg-white p-4.5 shadow-xs hover:border-fiscal-bordeaux/40 hover:shadow-md transition-all flex items-start gap-3.5"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 text-xl group-hover:scale-105 transition-transform">
            🤖
          </div>
          <div>
            <h4 className="font-bold text-sm text-gray-900 group-hover:text-fiscal-bordeaux transition-colors">
              Scoring Prédictif IA
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Score comportemental sur 100 points et recommandations automatisées d'actions.
            </p>
          </div>
        </Link>

        <Link
          to={ROUTES.MORATOIRES}
          className="group rounded-2xl border border-gray-200/90 bg-white p-4.5 shadow-xs hover:border-fiscal-bordeaux/40 hover:shadow-md transition-all flex items-start gap-3.5"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 text-xl group-hover:scale-105 transition-transform">
            💳
          </div>
          <div>
            <h4 className="font-bold text-sm text-gray-900 group-hover:text-fiscal-bordeaux transition-colors">
              Moratoires Fiscaux
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Plans d'échelonnement amiable, conventions officielles PDF et suivi des échéances.
            </p>
          </div>
        </Link>

        <Link
          to={ROUTES.RAPPORTS}
          className="group rounded-2xl border border-gray-200/90 bg-white p-4.5 shadow-xs hover:border-fiscal-bordeaux/40 hover:shadow-md transition-all flex items-start gap-3.5"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 text-xl group-hover:scale-105 transition-transform">
            📑
          </div>
          <div>
            <h4 className="font-bold text-sm text-gray-900 group-hover:text-fiscal-bordeaux transition-colors">
              Grand Livre & Exports
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Génération du Grand Livre certifié DGI et extraction comptable en Excel / CSV.
            </p>
          </div>
        </Link>
      </div>

    </div>
  );
}