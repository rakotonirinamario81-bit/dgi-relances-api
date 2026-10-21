import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { statistiqueService } from '@/services/statistiqueService';
import { Loader } from '@/components/common/Loader';
import { formaterMontant } from '@/utils/formatDate';
import { ROUTES } from '@/routes/routesConfig';

const PALETTE_COULEURS = ['#7a1e1e', '#c9a227', '#2563eb', '#10b981', '#8b5cf6', '#d97706', '#ec4899'];

export function StatistiquesPage() {
  const [repartitionImpot, setRepartitionImpot] = useState<Record<string, number>>({});
  const [evolutionMensuelle, setEvolutionMensuelle] = useState<Record<string, number>>({});
  const [zonesImpayes, setZonesImpayes] = useState<Record<string, number>>({});
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  // Type d'affichage du graphique chronologique
  const [typeGraphique, setTypeGraphique] = useState<'aire' | 'barres'>('aire');

  const chargerStatistiques = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [impot, evolution, zones] = await Promise.all([
        statistiqueService.repartitionParImpot(),
        statistiqueService.evolutionMensuelle(),
        statistiqueService.zonesImpayes(10),
      ]);
      setRepartitionImpot(impot ?? {});
      setEvolutionMensuelle(evolution ?? {});
      setZonesImpayes(zones ?? {});
    } catch (err: unknown) {
      console.error('Erreur chargement statistiques:', err);
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setErreur(e?.response?.data?.message ?? e?.message ?? 'Erreur lors du chargement des statistiques.');
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void chargerStatistiques();
  }, [chargerStatistiques]);

  // Données transformées et triées
  const donneesEvolution = useMemo(() => {
    return Object.entries(evolutionMensuelle)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mois, montant]) => ({
        mois,
        montant: Number(montant) || 0,
      }));
  }, [evolutionMensuelle]);

  const donneesImpot = useMemo(() => {
    return Object.entries(repartitionImpot)
      .map(([nom, montant]) => ({
        nom,
        montant: Number(montant) || 0,
      }))
      .sort((a, b) => b.montant - a.montant);
  }, [repartitionImpot]);

  const totalImpayesParImpot = useMemo(() => {
    return donneesImpot.reduce((sum, item) => sum + item.montant, 0);
  }, [donneesImpot]);

  const donneesZones = useMemo(() => {
    return Object.entries(zonesImpayes)
      .map(([commune, montant]) => ({
        commune,
        montant: Number(montant) || 0,
      }))
      .sort((a, b) => b.montant - a.montant);
  }, [zonesImpayes]);

  const totalImpayesZones = useMemo(() => {
    return donneesZones.reduce((sum, item) => sum + item.montant, 0);
  }, [donneesZones]);

  const totalRecouvrementMensuel = useMemo(() => {
    return donneesEvolution.reduce((sum, item) => sum + item.montant, 0);
  }, [donneesEvolution]);

  if (chargement) return <Loader />;

  if (erreur) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/80 p-8 text-center text-red-800 max-w-xl mx-auto my-12 shadow-sm">
        <div className="text-4xl mb-3">📊</div>
        <h2 className="text-lg font-bold">Impossible de charger les statistiques fiscales</h2>
        <p className="mt-1 text-sm text-red-600">{erreur}</p>
        <button
          onClick={() => void chargerStatistiques()}
          className="mt-4 rounded-xl bg-fiscal-bordeaux px-5 py-2.5 text-xs font-bold text-white hover:bg-fiscal-bordeauxFonce transition-colors shadow-sm"
        >
          🔄 Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">

      {/* ------------------------------------------------------------------- */}
      {/* 1. En-tête Institutionnel & Contrôles Rapides                      */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Statistiques & Analyses Fiscales
            </h1>
            <span className="rounded-full bg-fiscal-bordeaux/10 text-fiscal-bordeaux px-2.5 py-0.5 text-xs font-bold font-mono">
              CGI Madagascar
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Analyse quantitative des flux financiers, répartition par matière imposable et géographie du recouvrement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={ROUTES.RAPPORTS}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs"
          >
            <span>📑</span> Grand Livre & Exports
          </Link>
          <Link
            to={ROUTES.CARTOGRAPHIE}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs"
          >
            <span>🗺️</span> Carte SIG
          </Link>
          <button
            type="button"
            onClick={() => void chargerStatistiques()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-fiscal-bordeaux hover:bg-fiscal-bordeauxFonce px-3.5 py-2 text-xs font-bold text-white transition-colors shadow-xs"
          >
            <span>🔄</span> Actualiser
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 2. Cartes KPIs Analytiques                                         */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Recouvrement Cumulé */}
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-white to-white p-4.5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Total Encaissé
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 text-base shadow-2xs">
              💰
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-emerald-700 font-mono">
            {formaterMontant(totalRecouvrementMensuel)}
          </div>
          <p className="text-[11px] text-emerald-700/80 mt-1">
            Volume des paiements réels constatés
          </p>
        </div>

        {/* Masse des Impayés */}
        <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50/70 via-white to-white p-4.5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-800">
              Total Impayés Recensés
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-700 text-base shadow-2xs">
              ⚠️
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-red-700 font-mono">
            {formaterMontant(totalImpayesParImpot)}
          </div>
          <p className="text-[11px] text-red-600 mt-1">
            Créances fiscales nettes en instance
          </p>
        </div>

        {/* Natures d'Impôt Actives */}
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/70 via-white to-white p-4.5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
              Types d’Impôts Suivis
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 text-base shadow-2xs">
              ⚖️
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-blue-800 font-mono">
            {donneesImpot.length}
          </div>
          <p className="text-[11px] text-blue-600 mt-1">
            Rubriques fiscales sous contrôle
          </p>
        </div>

        {/* Localités Débitrices */}
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/70 via-white to-white p-4.5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Zones à Risque
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800 text-base shadow-2xs">
              📍
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-amber-800 font-mono">
            {donneesZones.length}
          </div>
          <p className="text-[11px] text-amber-700 mt-1">
            Communes concentrant des retards
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 3. Graphique Principal : Chronologie du Recouvrement              */}
      {/* ------------------------------------------------------------------- */}
      <div className="rounded-2xl border border-gray-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>📈</span> Dynamique Mensuelle des Encaissements
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Trajectoire temporelle des rentrées fiscales effectives au profit du Trésor Public
            </p>
          </div>

          {/* Sélecteur de style de graphique */}
          <div className="flex rounded-xl border border-gray-200 bg-gray-100 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setTypeGraphique('aire')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                typeGraphique === 'aire'
                  ? 'bg-white text-fiscal-bordeaux shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              📈 Aire & Tendance
            </button>
            <button
              type="button"
              onClick={() => setTypeGraphique('barres')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                typeGraphique === 'barres'
                  ? 'bg-white text-fiscal-bordeaux shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              📊 Histogramme
            </button>
          </div>
        </div>

        {donneesEvolution.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <span className="text-3xl block mb-2">🗓️</span>
            <p className="text-sm font-medium text-gray-600">Aucun historique d'encaissement disponible</p>
            <p className="text-xs text-gray-400 mt-0.5">Les données apparaîtront dès la comptabilisation des premiers règlements.</p>
          </div>
        ) : (
          <div>
            <ResponsiveContainer width="100%" height={290}>
              {typeGraphique === 'aire' ? (
                <AreaChart data={donneesEvolution} margin={{ top: 15, right: 20, left: 0, bottom: 10 }}>
                  <defs>
                    <linearGradient id="gradientStatRecouvrement" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7a1e1e" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#7a1e1e" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="mois" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                    }}
                    formatter={(val: number) => [formaterMontant(val), 'Montant Recouvré']}
                    labelFormatter={(label) => `Mois d’encaissement : ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="montant"
                    stroke="#7a1e1e"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#gradientStatRecouvrement)"
                    dot={{ r: 4, fill: '#7a1e1e', stroke: '#ffffff', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#c9a227' }}
                  />
                </AreaChart>
              ) : (
                <BarChart data={donneesEvolution} margin={{ top: 15, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="mois" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                    }}
                    formatter={(val: number) => [formaterMontant(val), 'Montant Recouvré']}
                    labelFormatter={(label) => `Mois d’encaissement : ${label}`}
                  />
                  <Bar dataKey="montant" maxBarSize={55} radius={[8, 8, 0, 0]} fill="#7a1e1e" />
                </BarChart>
              )}
            </ResponsiveContainer>

            {/* Barre de synthèse chronologique */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-100 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <span className="text-gray-500">Mois actif le plus récent :</span>
                <span className="font-bold text-gray-900 font-mono">
                  {donneesEvolution[donneesEvolution.length - 1]?.mois || '-'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <span className="text-gray-500">Moyenne mensuelle :</span>
                <span className="font-bold text-gray-900 font-mono">
                  {formaterMontant(
                    donneesEvolution.length > 0 ? totalRecouvrementMensuel / donneesEvolution.length : 0
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <span className="text-gray-500">Total période :</span>
                <span className="font-bold text-fiscal-bordeaux font-mono">
                  {formaterMontant(totalRecouvrementMensuel)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 4. Double Volet Analytique (Assiette d'impôt & Géographie)         */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Volet 1 : Répartition par Type d'Impôt */}
        <div className="rounded-2xl border border-gray-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <span>🥧</span> Assiette des Impayés par Type d'Impôt
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Ventilation de la créance fiscale par catégorie légale
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 font-mono">
                {donneesImpot.length} catégorie(s)
              </span>
            </div>

            {donneesImpot.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-400">Aucune dette fiscale enregistrée.</p>
            ) : (
              <div className="space-y-4">
                {/* Donut Chart */}
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={donneesImpot}
                        dataKey="montant"
                        nameKey="nom"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                      >
                        {donneesImpot.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PALETTE_COULEURS[index % PALETTE_COULEURS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: number) => [formaterMontant(val), 'Montant']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Liste détaillée avec barres proportionnelles */}
                <div className="space-y-2.5 divide-y divide-gray-50">
                  {donneesImpot.map((item, index) => {
                    const pourcentage = totalImpayesParImpot > 0
                      ? ((item.montant / totalImpayesParImpot) * 100).toFixed(1)
                      : '0';
                    const couleur = PALETTE_COULEURS[index % PALETTE_COULEURS.length];

                    return (
                      <div key={item.nom} className="pt-2 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: couleur }}
                            />
                            <span className="font-semibold text-gray-800 truncate">{item.nom}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono font-bold text-gray-900">
                              {formaterMontant(item.montant)}
                            </span>
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-600 font-mono">
                              {pourcentage}%
                            </span>
                          </div>
                        </div>

                        {/* Barre proportionnelle */}
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, Number(pourcentage))}%`,
                              backgroundColor: couleur,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Volet 2 : Zones Géographiques avec le plus d'impayés */}
        <div className="rounded-2xl border border-gray-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <span>🗺️</span> Topographie Territoriale des Impayés
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Communes et centres fiscaux concentrant le plus de dettes
                </p>
              </div>
              <Link
                to={ROUTES.CARTOGRAPHIE}
                className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-fiscal-bordeaux hover:bg-gray-50 transition-colors"
              >
                Carte interactive →
              </Link>
            </div>

            {donneesZones.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-400">Aucune zone à signaler.</p>
            ) : (
              <div className="space-y-3">
                {donneesZones.map((z, index) => {
                  const part = totalImpayesZones > 0
                    ? ((z.montant / totalImpayesZones) * 100).toFixed(1)
                    : '0';

                  return (
                    <div
                      key={z.commune}
                      className="rounded-xl border border-gray-100 bg-slate-50/60 p-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                              index === 0
                                ? 'bg-red-500 text-white'
                                : index === 1
                                ? 'bg-amber-500 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            #{index + 1}
                          </span>
                          <span className="font-bold text-gray-900">{z.commune}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-red-700">
                            {formaterMontant(z.montant)}
                          </span>
                          <span className="rounded bg-red-100 text-red-800 px-1.5 py-0.5 text-[10px] font-bold font-mono">
                            {part}%
                          </span>
                        </div>
                      </div>

                      {/* Jauge de risque territorial */}
                      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-red-500 transition-all duration-300"
                          style={{ width: `${Math.min(100, Number(part))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Données synchronisées avec les centres fiscaux régionaux</span>
            <Link
              to={ROUTES.CARTOGRAPHIE}
              className="font-bold text-fiscal-bordeaux hover:underline"
            >
              Voir heatmap nationale →
            </Link>
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 5. Bannière Stratégique Décisionnelle DGI                           */}
      {/* ------------------------------------------------------------------- */}
      <div className="rounded-2xl border border-fiscal-or/40 bg-gradient-to-r from-fiscal-bordeaux/5 via-fiscal-or/10 to-transparent p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-fiscal-bordeaux text-fiscal-or text-2xl shadow-sm">
            🎯
          </div>
          <div>
            <h4 className="text-base font-bold text-gray-900">
              Pilotage des Objectifs Stratégiques DGI
            </h4>
            <p className="text-xs text-gray-600 mt-0.5 max-w-xl">
              Ces indicateurs alimentent le rapport périodique de performance fiscale pour le Ministère des Finances.
              Consultez le Grand Livre consolidé pour le détail analytique audité.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to={ROUTES.RAPPORTS}
            className="rounded-xl bg-fiscal-bordeaux hover:bg-fiscal-bordeauxFonce px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors"
          >
            Télécharger le Rapport Exécutif PDF
          </Link>
          <Link
            to={ROUTES.SCORING_RISQUE}
            className="rounded-xl border border-gray-300 bg-white hover:bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-700 transition-colors"
          >
            Analyse IA →
          </Link>
        </div>
      </div>

    </div>
  );
}