import { useState, useEffect, useMemo, useCallback } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { CampagneForm } from '@/components/metier/CampagneForm';
import { Badge } from '@/components/common/Badge';
import { campagneRelanceService } from '@/services/campagneRelanceService';
import { extraireMessageErreur } from '@/services/apiClient';
import type { CampagneRelance, CampagneRelanceDTO, StatutCampagne } from '@/types/campagneRelance.types';
import { formaterDateFr } from '@/utils/formatDate';

const BADGE_STATUT: Record<StatutCampagne, { couleur: 'gris' | 'bleu' | 'vert' | 'rouge'; label: string; bg: string }> = {
  PLANIFIEE: { couleur: 'gris', label: 'Planifiée', bg: 'bg-slate-100 text-slate-800 border-slate-300' },
  EN_COURS: { couleur: 'bleu', label: 'En cours', bg: 'bg-blue-100 text-blue-800 border-blue-300' },
  TERMINEE: { couleur: 'vert', label: 'Terminée', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  ANNULEE: { couleur: 'rouge', label: 'Annulée', bg: 'bg-red-100 text-red-800 border-red-300' },
};

export function CampagnesRelancePage() {
  const [campagnes, setCampagnes] = useState<CampagneRelance[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);

  // Filtres et recherche
  const [recherche, setRecherche] = useState('');
  const [ongletStatut, setOngletStatut] = useState<'TOUTES' | StatutCampagne>('TOUTES');
  const [modeVue, setModeVue] = useState<'cartes' | 'table'>('cartes');

  // Modals
  const [modalCreationOuverte, setModalCreationOuverte] = useState(false);
  const [campagneSelectionnee, setCampagneSelectionnee] = useState<CampagneRelance | null>(null);
  const [creationEnCours, setCreationEnCours] = useState(false);
  const [lancementEnCoursId, setLancementEnCoursId] = useState<number | null>(null);

  const chargerCampagnes = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const data = await campagneRelanceService.lister();
      setCampagnes(data);
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void chargerCampagnes();
  }, [chargerCampagnes]);

  // Statistiques KPIs
  const kpis = useMemo(() => {
    const total = campagnes.length;
    const enCours = campagnes.filter((c) => c.statut === 'EN_COURS').length;
    const planifiees = campagnes.filter((c) => c.statut === 'PLANIFIEE').length;
    const totalRelances = campagnes.reduce((acc, c) => acc + (c.nombreRelancesEnvoyees ?? 0), 0);
    const moyenneReussite =
      total > 0
        ? Math.round(campagnes.reduce((acc, c) => acc + (c.tauxReussite ?? 0), 0) / total)
        : 0;

    return { total, enCours, planifiees, totalRelances, moyenneReussite };
  }, [campagnes]);

  // Filtrage des campagnes
  const campagnesFiltrees = useMemo(() => {
    return campagnes.filter((c) => {
      if (ongletStatut !== 'TOUTES' && c.statut !== ongletStatut) return false;
      if (recherche.trim()) {
        const q = recherche.toLowerCase();
        return (
          c.nom.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q)) ||
          (c.impotCibleCode && c.impotCibleCode.toLowerCase().includes(q)) ||
          (c.periodeFiscaleCible && c.periodeFiscaleCible.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [campagnes, ongletStatut, recherche]);

  async function gererCreation(dto: CampagneRelanceDTO) {
    setErreur(null);
    setSucces(null);
    setCreationEnCours(true);
    try {
      const nouvelle = await campagneRelanceService.creer(dto);
      setCampagnes((prev) => [nouvelle, ...prev]);
      setModalCreationOuverte(false);
      setSucces(`La campagne "${nouvelle.nom}" a été créée avec succès.`);
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setCreationEnCours(false);
    }
  }

  async function gererLancement(id: number) {
    setErreur(null);
    setSucces(null);
    setLancementEnCoursId(id);
    try {
      const lancee = await campagneRelanceService.lancer(id);
      setCampagnes((prev) => prev.map((c) => (c.id === id ? lancee : c)));
      if (campagneSelectionnee?.id === id) {
        setCampagneSelectionnee(lancee);
      }
      setSucces(`La campagne "${lancee.nom}" a été lancée. Les relances ciblées ont été expédiées.`);
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setLancementEnCoursId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Bannière Institutionnelle DGI */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-fiscal-bordeaux via-[#601414] to-[#3a0a0a] p-6 text-white shadow-xl border border-red-900/40">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md border border-white/15">
              <span>🇲🇬</span>
              <span>DIRECTION REGIONALE DES IMPOTS - VATOVAVY FITOVINANY · OPÉRATIONS COLLECTIVES</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>📢</span> Campagnes de Relances Groupées
            </h1>
            <p className="text-xs sm:text-sm text-red-100 max-w-2xl font-light leading-relaxed">
              Planification et exécution automatisée de campagnes de relances par ciblage multicritère (impôt, ancienneté de la dette, niveau de risque IA) avec suivi des taux d'acheminement en temps réel.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 self-start md:self-auto">
            <Button
              onClick={() => setModalCreationOuverte(true)}
              className="!bg-amber-400 !text-gray-950 hover:!bg-amber-300 font-extrabold text-xs shadow-md border-0"
            >
              ➕ Nouvelle Campagne
            </Button>
            <Button
              variante="secondaire"
              onClick={() => void chargerCampagnes()}
              enCours={chargement}
              className="!bg-white/15 !text-white !border-white/20 hover:!bg-white/25 text-xs shadow-sm"
            >
              🔄 Actualiser
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Cartes KPIs Stratégiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 : Total Campagnes */}
        <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Campagnes Totales</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-700 text-lg">
              📢
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-gray-900">{kpis.total}</span>
            <span className="text-xs text-gray-500 font-medium">opérations</span>
          </div>
          <div className="mt-2 text-[11px] text-gray-500">
            {kpis.planifiees} planifiée(s) · {kpis.enCours} en cours
          </div>
        </div>

        {/* KPI 2 : Campagnes En Cours */}
        <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">En Cours d'Exécution</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700 text-lg">
              ⚡
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-blue-700">{kpis.enCours}</span>
            <span className="text-xs text-blue-600 font-semibold">actives</span>
          </div>
          <div className="mt-2 text-[11px] text-gray-500">
            Diffusions programmées ou automatiques
          </div>
        </div>

        {/* KPI 3 : Relances Expédiées en Masse */}
        <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Relances Envoyées</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 text-lg">
              📬
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-gray-900">{kpis.totalRelances}</span>
            <span className="text-xs text-gray-500 font-medium">avis délivrés</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-700 font-semibold">
            Canaux combinés SMS & Email
          </div>
        </div>

        {/* KPI 4 : Taux Moyen de Réussite */}
        <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Taux Moyen Délivrance</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700 text-lg">
              🎯
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-gray-900">{kpis.moyenneReussite}%</span>
            <span className="text-xs text-gray-500 font-medium">réussite</span>
          </div>
          <div className="mt-2 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(kpis.moyenneReussite, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bannières de Feedback */}
      {erreur && (
        <div className="rounded-xl bg-red-50 p-4 text-xs text-red-800 border border-red-200 flex items-start gap-2.5">
          <span className="text-base">⚠️</span>
          <div>
            <span className="font-bold block">Erreur opérationnelle :</span>
            <span>{erreur}</span>
          </div>
        </div>
      )}

      {succes && (
        <div className="rounded-xl bg-green-50 p-4 text-xs text-green-900 border border-green-200 flex items-start gap-2.5">
          <span className="text-base">✅</span>
          <div>
            <span className="font-bold block">Opération réussie :</span>
            <span>{succes}</span>
          </div>
        </div>
      )}

      {/* 3. Barre d'outils, Recherche & Filtres */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Onglets de Statut */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          {(['TOUTES', 'EN_COURS', 'PLANIFIEE', 'TERMINEE'] as const).map((st) => {
            const count = st === 'TOUTES' ? campagnes.length : campagnes.filter((c) => c.statut === st).length;
            const label = st === 'TOUTES' ? 'Toutes les Campagnes' : BADGE_STATUT[st].label;
            const estActif = ongletStatut === st;

            return (
              <button
                key={st}
                type="button"
                onClick={() => setOngletStatut(st)}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  estActif
                    ? 'bg-fiscal-bordeaux text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${estActif ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-800'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Recherche et Basculeur de vue */}
        <div className="flex items-center gap-2.5">
          <input
            type="text"
            placeholder="Rechercher une campagne..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="w-full sm:w-56 rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-fiscal-bordeaux focus:ring-1 focus:ring-fiscal-bordeaux"
          />

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setModeVue('cartes')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                modeVue === 'cartes'
                  ? 'bg-fiscal-bordeaux text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Vue Cartes"
            >
              <span>🗂️</span>
              <span className="hidden sm:inline">Cartes</span>
            </button>
            <button
              type="button"
              onClick={() => setModeVue('table')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                modeVue === 'table'
                  ? 'bg-fiscal-bordeaux text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Vue Tableau"
            >
              <span>📊</span>
              <span className="hidden sm:inline">Tableau</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Affichage des Campagnes */}
      {chargement && campagnes.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-xs text-gray-400">
          <span className="inline-block animate-spin text-3xl mb-2">⏳</span>
          <p>Chargement des campagnes de relance...</p>
        </div>
      ) : campagnesFiltrees.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white p-12 text-center space-y-3">
          <span className="text-4xl block">📢</span>
          <h3 className="text-base font-extrabold text-gray-900">Aucune campagne de relance trouvée</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            {campagnes.length === 0
              ? 'Aucune opération collective de relance n’a encore été enregistrée dans la base de données DGI.'
              : 'Aucune campagne ne correspond aux critères de filtre sélectionnés.'}
          </p>
          <div className="pt-2">
            <Button
              onClick={() => setModalCreationOuverte(true)}
              className="!bg-fiscal-bordeaux text-white px-5 py-2 text-xs font-bold shadow"
            >
              ➕ Créer une première campagne
            </Button>
          </div>
        </div>
      ) : modeVue === 'cartes' ? (
        /* MODE CARTES EXÉCUTIVES */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {campagnesFiltrees.map((campagne) => {
            const statutInfo = BADGE_STATUT[campagne.statut];
            const estLancementEnCours = lancementEnCoursId === campagne.id;

            return (
              <div
                key={campagne.id}
                className="rounded-xl border border-gray-200/90 bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  {/* En-tête de la carte */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-gray-100">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${statutInfo.bg}`}>
                          {statutInfo.label}
                        </span>
                        {campagne.impotCibleCode && (
                          <span className="rounded bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-bold text-red-800">
                            {campagne.impotCibleCode}
                          </span>
                        )}
                        {campagne.niveauRisqueCible && (
                          <span className="rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            {campagne.niveauRisqueCible.replace('RISQUE_', 'Risque ')}
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-gray-900 text-sm mt-1.5 leading-snug">
                        {campagne.nom}
                      </h3>
                    </div>
                  </div>

                  {/* Description */}
                  {campagne.description && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                      {campagne.description}
                    </p>
                  )}

                  {/* Badges de ciblage */}
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                    <span className="rounded-md bg-gray-100 px-2 py-1 text-gray-700 font-medium">
                      ⏳ Retard : &ge; {campagne.joursRetardMin ?? 0} jours
                    </span>
                    {campagne.periodeFiscaleCible && (
                      <span className="rounded-md bg-gray-100 px-2 py-1 text-gray-700 font-mono font-medium">
                        📅 Période : {campagne.periodeFiscaleCible}
                      </span>
                    )}
                    {campagne.canal && (
                      <span className="rounded-md bg-gray-100 px-2 py-1 text-gray-700 font-medium">
                        {campagne.canal === 'SMS' ? '📱 SMS' : '📧 Email'}
                      </span>
                    )}
                  </div>

                  {/* Statistiques d'acheminement */}
                  <div className="mt-4 rounded-xl bg-gray-50 border border-gray-200/80 p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-medium">Taux d'acheminement</span>
                      <span className="font-extrabold font-mono text-gray-900">
                        {campagne.tauxReussite ? `${campagne.tauxReussite.toFixed(1)}%` : '0%'}
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${Math.min(campagne.tauxReussite ?? 0, 100)}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-1 pt-1 text-center text-[10px]">
                      <div>
                        <span className="text-gray-400 block">Envoyées</span>
                        <span className="font-bold text-gray-800">{campagne.nombreRelancesEnvoyees}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Échecs</span>
                        <span className="font-bold text-red-600">{campagne.nombreEchecs}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Total</span>
                        <span className="font-bold text-gray-900">{campagne.totalRelances}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions au bas de la carte */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-gray-400">
                    Début : {formaterDateFr(campagne.dateDebut)}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {campagne.statut === 'PLANIFIEE' && (
                      <Button
                        onClick={() => void gererLancement(campagne.id)}
                        enCours={estLancementEnCours}
                        className="text-xs !py-1.5 !px-3 !bg-fiscal-bordeaux text-white shadow-sm font-extrabold"
                      >
                        🚀 Lancer
                      </Button>
                    )}

                    <button
                      type="button"
                      onClick={() => setCampagneSelectionnee(campagne)}
                      className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      👁️ Détails
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* MODE TABLEAU DENSE DESKTOP */
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100/80 border-b border-gray-200 text-gray-600 font-extrabold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Nom de la Campagne</th>
                  <th className="py-3 px-3">Ciblage</th>
                  <th className="py-3 px-3">Modèle & Canal</th>
                  <th className="py-3 px-3">Dates</th>
                  <th className="py-3 px-3 text-center">Taux Succès</th>
                  <th className="py-3 px-3 text-center">Statut</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-sans">
                {campagnesFiltrees.map((campagne) => {
                  const statutInfo = BADGE_STATUT[campagne.statut];
                  const estLancementEnCours = lancementEnCoursId === campagne.id;

                  return (
                    <tr key={campagne.id} className="hover:bg-red-50/20 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        <div>{campagne.nom}</div>
                        {campagne.description && (
                          <div className="text-[11px] text-gray-400 line-clamp-1">{campagne.description}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex flex-wrap gap-1">
                          {campagne.impotCibleCode && (
                            <span className="rounded bg-red-50 text-red-800 px-1.5 py-0.5 text-[10px] font-bold">
                              {campagne.impotCibleCode}
                            </span>
                          )}
                          <span className="rounded bg-gray-100 text-gray-700 px-1.5 py-0.5 text-[10px]">
                            &ge; {campagne.joursRetardMin ?? 0}j
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-gray-800">
                          {campagne.modeleMessageNom || 'Modèle standard'}
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono">
                          {campagne.canal === 'SMS' ? '📱 SMS' : '📧 Email'}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 font-mono text-[11px] text-gray-600">
                        {formaterDateFr(campagne.dateDebut)}
                        {campagne.dateFin && ` → ${formaterDateFr(campagne.dateFin)}`}
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono font-bold text-gray-900">
                        {campagne.tauxReussite ? `${campagne.tauxReussite.toFixed(1)}%` : '0%'}
                        <div className="text-[10px] text-gray-400 font-normal">
                          {campagne.nombreRelancesEnvoyees}/{campagne.totalRelances}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${statutInfo.bg}`}>
                          {statutInfo.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {campagne.statut === 'PLANIFIEE' && (
                            <Button
                              onClick={() => void gererLancement(campagne.id)}
                              enCours={estLancementEnCours}
                              className="text-xs !py-1 !px-2.5 !bg-fiscal-bordeaux text-white font-extrabold shadow-sm"
                            >
                              🚀 Lancer
                            </Button>
                          )}
                          <button
                            type="button"
                            onClick={() => setCampagneSelectionnee(campagne)}
                            className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            👁️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Modal de Création de Campagne */}
      <Modal
        ouverte={modalCreationOuverte}
        titre="Nouvelle Campagne de Relance Fiscale"
        taille="2xl"
        onFermer={() => setModalCreationOuverte(false)}
      >
        <CampagneForm onSoumettre={gererCreation} enCours={creationEnCours} />
      </Modal>

      {/* 6. Modal de Détail d'une Campagne */}
      {campagneSelectionnee && (
        <Modal
          ouverte={Boolean(campagneSelectionnee)}
          titre={`Détail de l'Opération : ${campagneSelectionnee.nom}`}
          taille="xl"
          onFermer={() => setCampagneSelectionnee(null)}
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <Badge couleur={BADGE_STATUT[campagneSelectionnee.statut].couleur}>
                {BADGE_STATUT[campagneSelectionnee.statut].label}
              </Badge>
              <span className="text-xs text-gray-500 font-mono">
                Créée par : {campagneSelectionnee.createurNom || 'Inspecteur DGI'}
              </span>
            </div>

            {campagneSelectionnee.description && (
              <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
                <strong>Objectif :</strong> {campagneSelectionnee.description}
              </div>
            )}

            {/* Statistiques détaillées */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="rounded-xl border border-gray-200 bg-white p-3">
                <span className="text-[10px] text-gray-400 block uppercase">Retard Min</span>
                <span className="text-base font-extrabold text-gray-900">
                  {campagneSelectionnee.joursRetardMin ? `${campagneSelectionnee.joursRetardMin} j` : '0 j'}
                </span>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-3">
                <span className="text-[10px] text-gray-400 block uppercase">Relances Envoyées</span>
                <span className="text-base font-extrabold text-emerald-700">
                  {campagneSelectionnee.nombreRelancesEnvoyees}
                </span>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-3">
                <span className="text-[10px] text-gray-400 block uppercase">Échecs</span>
                <span className="text-base font-extrabold text-red-600">
                  {campagneSelectionnee.nombreEchecs}
                </span>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-3">
                <span className="text-[10px] text-gray-400 block uppercase">Taux Réussite</span>
                <span className="text-base font-extrabold text-fiscal-bordeaux">
                  {campagneSelectionnee.tauxReussite ? `${campagneSelectionnee.tauxReussite.toFixed(1)}%` : '0%'}
                </span>
              </div>
            </div>

            {/* Critères appliqués */}
            <div className="rounded-xl border border-gray-200 p-4 space-y-2 text-xs">
              <h4 className="font-extrabold text-gray-900">Paramètres de ciblage :</h4>
              <div className="grid grid-cols-2 gap-2 text-gray-700">
                <div>Impôt visé : <strong>{campagneSelectionnee.impotCibleCode || 'Tous'}</strong></div>
                <div>Période fiscale : <strong>{campagneSelectionnee.periodeFiscaleCible || 'Toutes'}</strong></div>
                <div>Niveau risque : <strong>{campagneSelectionnee.niveauRisqueCible || 'Tous niveaux'}</strong></div>
                <div>Modèle message : <strong>{campagneSelectionnee.modeleMessageNom || 'Standard'}</strong></div>
              </div>
            </div>

            {/* Actions du modal */}
            <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
              {campagneSelectionnee.statut === 'PLANIFIEE' && (
                <Button
                  onClick={() => void gererLancement(campagneSelectionnee.id)}
                  enCours={lancementEnCoursId === campagneSelectionnee.id}
                  className="!bg-fiscal-bordeaux text-white text-xs font-bold"
                >
                  🚀 Exécuter la campagne immédiatement
                </Button>
              )}
              <Button
                variante="secondaire"
                onClick={() => setCampagneSelectionnee(null)}
                className="text-xs"
              >
                Fermer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}