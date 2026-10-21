import { useEffect, useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Table, type ColonneTable } from '@/components/common/Table';
import { calendrierFiscalService } from '@/services/calendrierFiscalService';
import { extraireMessageErreur } from '@/services/apiClient';
import type { DeclarationFiscaleDTO, EcheanceFiscale, RelanceEcheanceDTO } from '@/types/calendrierFiscal.types';
import { formaterDateFr, formaterMontant } from '@/utils/formatDate';

function getInitiales(nom: string): string {
  if (!nom) return 'CF';
  const parts = nom.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function EcheancesFiscalesPage() {
  const [ongletActif, setOngletActif] = useState<'defaillants' | 'toutes'>('defaillants');
  const [echeances, setEcheances] = useState<EcheanceFiscale[]>([]);
  const [defaillants, setDefaillants] = useState<EcheanceFiscale[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  // Filtres et recherche
  const [recherche, setRecherche] = useState('');
  const [filtreImpot, setFiltreImpot] = useState<string>('TOUS');
  const [filtreRetard, setFiltreRetard] = useState<string>('TOUS');
  const [modeVue, setModeVue] = useState<'table' | 'cartes'>('table');

  // Pagination
  const [pageCourante, setPageCourante] = useState(1);
  const [elementsParPage, setElementsParPage] = useState(25);

  // Modal Déclaration
  const [echeanceADeclarer, setEcheanceADeclarer] = useState<EcheanceFiscale | null>(null);
  const [formDeclaration, setFormDeclaration] = useState<DeclarationFiscaleDTO>({
    echeanceId: 0,
    dateDepot: new Date().toISOString().split('T')[0],
    montantDeclare: 0,
    methodeDepot: 'TELEDECLARATION_EHETRA',
    refAccuseReception: '',
  });
  const [declarationEnCours, setDeclarationEnCours] = useState(false);

  // Modal Relance
  const [echeanceARelancer, setEcheanceARelancer] = useState<EcheanceFiscale | null>(null);
  const [canalRelance, setCanalRelance] = useState<'SMS' | 'EMAIL' | 'SMS_ET_EMAIL'>('SMS_ET_EMAIL');
  const [messagePersonnalise, setMessagePersonnalise] = useState<string>('');
  const [relanceEnCours, setRelanceEnCours] = useState(false);
  const [messageSuccesRelance, setMessageSuccesRelance] = useState<string | null>(null);

  const chargerDonnees = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [toutesData, defaillantsData] = await Promise.all([
        calendrierFiscalService.listerEcheances(),
        calendrierFiscalService.listerDefaillants(),
      ]);
      setEcheances(toutesData);
      setDefaillants(defaillantsData);
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void chargerDonnees();
  }, [chargerDonnees]);

  // -------------------------------------------------------------------------
  // KPI Métier Déclaratif
  // -------------------------------------------------------------------------
  const kpi = useMemo(() => {
    const total = echeances.length;
    const nbDefaillants = defaillants.length;
    const nbDeposes = echeances.filter((e) => e.statut === 'DEPOT_EFFECTUE').length;
    const tauxConformite = total > 0 ? (nbDeposes / total) * 100 : 100;

    return {
      total,
      nbDefaillants,
      nbDeposes,
      tauxConformite,
    };
  }, [echeances, defaillants]);

  // Liste unique des impôts pour le filtre
  const listeCodesImpots = useMemo(() => {
    const source = ongletActif === 'defaillants' ? defaillants : echeances;
    const codes = new Set(source.map((e) => e.impotCode).filter(Boolean));
    return Array.from(codes);
  }, [ongletActif, defaillants, echeances]);

  // -------------------------------------------------------------------------
  // Filtrage et Pagination
  // -------------------------------------------------------------------------
  const donneesFiltrees = useMemo(() => {
    const source = ongletActif === 'defaillants' ? defaillants : echeances;

    return source.filter((e) => {
      // Recherche textuelle
      if (recherche.trim()) {
        const q = recherche.toLowerCase();
        const matchNom = e.contribuableNom?.toLowerCase().includes(q);
        const matchNif = e.contribuableNif?.toLowerCase().includes(q);
        const matchImpot = e.impotCode?.toLowerCase().includes(q) || e.impotLibelle?.toLowerCase().includes(q);
        const matchPeriode = e.periode?.toLowerCase().includes(q);
        if (!matchNom && !matchNif && !matchImpot && !matchPeriode) return false;
      }

      // Filtre Impôt
      if (filtreImpot !== 'TOUS' && e.impotCode !== filtreImpot) {
        return false;
      }

      // Filtre Gravité du retard (pour les défaillants)
      if (ongletActif === 'defaillants' && filtreRetard !== 'TOUS') {
        const retard = e.joursDeRetard || 0;
        if (filtreRetard === 'MOINS_30' && retard >= 30) return false;
        if (filtreRetard === '30_60' && (retard < 30 || retard > 60)) return false;
        if (filtreRetard === 'PLUS_60' && retard <= 60) return false;
      }

      return true;
    });
  }, [ongletActif, defaillants, echeances, recherche, filtreImpot, filtreRetard]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(donneesFiltrees.length / elementsParPage));
  const donneesPaginees = useMemo(() => {
    const debut = (pageCourante - 1) * elementsParPage;
    return donneesFiltrees.slice(debut, debut + elementsParPage);
  }, [donneesFiltrees, pageCourante, elementsParPage]);

  // Réinitialiser la page si les filtres changent
  useEffect(() => {
    setPageCourante(1);
  }, [recherche, filtreImpot, filtreRetard, ongletActif]);

  // -------------------------------------------------------------------------
  // Gestionnaires des Modales
  // -------------------------------------------------------------------------
  function ouvrirModalDeclaration(e: EcheanceFiscale) {
    setEcheanceADeclarer(e);
    setFormDeclaration({
      echeanceId: e.id,
      dateDepot: new Date().toISOString().split('T')[0],
      montantDeclare: 0,
      methodeDepot: 'TELEDECLARATION_EHETRA',
      refAccuseReception: `REC-${Date.now().toString().slice(-6)}`,
    });
  }

  async function gererDeclaration() {
    if (!echeanceADeclarer) return;
    setDeclarationEnCours(true);
    try {
      await calendrierFiscalService.enregistrerDeclaration(formDeclaration);
      setEcheanceADeclarer(null);
      await chargerDonnees();
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setDeclarationEnCours(false);
    }
  }

  function ouvrirModalRelance(e: EcheanceFiscale) {
    setEcheanceARelancer(e);
    setCanalRelance('SMS_ET_EMAIL');
    setMessageSuccesRelance(null);
    setMessagePersonnalise(
      `L'examen du dossier fiscal de votre entreprise nous a permis de constater que vous n'avez pas encore déposé votre déclaration d'impôt notamment sur l'${e.impotLibelle} (${e.impotCode}) période de ${e.periode} et ceci malgré le temps qui s'est écoulé depuis l'échéance de dépôt légalement prévue par le Code Général des Impôts (échéance : ${formaterDateFr(e.dateLimite)}).`
    );
  }

  async function gererRelance() {
    if (!echeanceARelancer) return;
    setRelanceEnCours(true);
    setMessageSuccesRelance(null);
    try {
      const dto: RelanceEcheanceDTO = {
        echeanceId: echeanceARelancer.id,
        canal: canalRelance,
        messagePersonnalise,
      };
      const res = await calendrierFiscalService.relancerDefaillant(dto);
      setMessageSuccesRelance(res.message);
      await chargerDonnees();
      setTimeout(() => {
        setEcheanceARelancer(null);
        setMessageSuccesRelance(null);
      }, 2000);
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setRelanceEnCours(false);
    }
  }

  async function telechargerPdf(echeanceId: number) {
    try {
      await calendrierFiscalService.telechargerLettrePdf(echeanceId);
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    }
  }

  async function apercuPdf(echeanceId: number) {
    try {
      await calendrierFiscalService.ouvrirLettrePdfDansNouvelOnglet(echeanceId);
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    }
  }

  // -------------------------------------------------------------------------
  // Colonnes du Tableau Défaillants (Épurées et Responsive)
  // -------------------------------------------------------------------------
  const colonnesDefaillants: ColonneTable<EcheanceFiscale>[] = [
    {
      cle: 'contribuableNom',
      entete: 'Contribuable',
      rendu: (e) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-800 font-bold text-xs shadow-2xs">
            {getInitiales(e.contribuableNom)}
          </div>
          <div>
            <div className="font-bold text-gray-900 leading-snug">{e.contribuableNom}</div>
            <div className="text-[10px] text-gray-400 font-mono">NIF : {e.contribuableNif}</div>
          </div>
        </div>
      ),
    },
    {
      cle: 'impotCode',
      entete: 'Nature d’Impôt',
      rendu: (e) => (
        <span
          className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-800"
          title={e.impotLibelle}
        >
          {e.impotCode}
        </span>
      ),
    },
    {
      cle: 'periode',
      entete: 'Période',
      rendu: (e) => (
        <span className="font-mono text-xs font-medium text-gray-700 bg-gray-50 px-2 py-0.5 rounded border border-gray-200/70">
          {e.periode}
        </span>
      ),
    },
    {
      cle: 'dateLimite',
      entete: 'Échéance légale',
      rendu: (e) => <span className="text-xs text-gray-600">{formaterDateFr(e.dateLimite)}</span>,
    },
    {
      cle: 'joursDeRetard',
      entete: 'Dépassement',
      rendu: (e) => (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-xs font-bold text-red-700">
          <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
          +{e.joursDeRetard} j
        </span>
      ),
      alignementDroite: true,
    },
    {
      cle: 'statut',
      entete: 'Statut',
      rendu: (e) => (
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
            e.statut === 'RELANCE'
              ? 'bg-amber-100 text-amber-900 border border-amber-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}
        >
          {e.statut === 'RELANCE' ? '🟡 RELANCÉ' : '🔴 NON DÉPOSÉ'}
        </span>
      ),
    },
    {
      cle: 'actions' as const,
      entete: 'Actions',
      rendu: (e: EcheanceFiscale) => (
        <div className="flex items-center gap-1.5 justify-end">
          {/* Action principale Relance */}
          <button
            type="button"
            onClick={() => ouvrirModalRelance(e)}
            className="inline-flex items-center gap-1 rounded-lg bg-fiscal-bordeaux hover:bg-fiscal-bordeauxFonce px-2.5 py-1 text-xs font-bold text-white shadow-2xs transition-colors"
            title="Lancer la procédure de relance officielle"
          >
            <span>📨</span> Relancer
          </button>

          {/* Action Déclaration rapide */}
          <button
            type="button"
            onClick={() => ouvrirModalDeclaration(e)}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 shadow-2xs transition-colors"
            title="Enregistrer la réception d'une déclaration"
          >
            <span>📝</span> Déclarer
          </button>

          {/* Documents PDF sous forme d'icônes avec tooltips */}
          <button
            type="button"
            onClick={() => void telechargerPdf(e.id)}
            className="rounded-lg border border-gray-200 bg-white p-1 text-gray-600 hover:text-fiscal-bordeaux hover:bg-gray-50 transition-colors shadow-2xs"
            title="Télécharger la lettre officielle PDF"
          >
            📄
          </button>
          <button
            type="button"
            onClick={() => void apercuPdf(e.id)}
            className="rounded-lg border border-blue-200 bg-blue-50/50 p-1 text-blue-700 hover:bg-blue-100 transition-colors shadow-2xs"
            title="Aperçu de la lettre PDF dans un nouvel onglet"
          >
            👁️
          </button>
        </div>
      ),
      alignementDroite: true,
    },
  ];

  // -------------------------------------------------------------------------
  // Colonnes du Tableau Toutes les Échéances
  // -------------------------------------------------------------------------
  const colonnesToutes: ColonneTable<EcheanceFiscale>[] = [
    {
      cle: 'contribuableNom',
      entete: 'Contribuable',
      rendu: (e) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 font-bold text-xs shadow-2xs">
            {getInitiales(e.contribuableNom)}
          </div>
          <div>
            <div className="font-bold text-gray-900 leading-snug">{e.contribuableNom}</div>
            <div className="text-[10px] text-gray-400 font-mono">NIF : {e.contribuableNif}</div>
          </div>
        </div>
      ),
    },
    {
      cle: 'impotLibelle',
      entete: 'Impôt',
      rendu: (e) => (
        <span className="font-semibold text-slate-800 text-xs">
          {e.impotCode} <span className="font-normal text-gray-500">— {e.impotLibelle}</span>
        </span>
      ),
    },
    {
      cle: 'periode',
      entete: 'Période',
      rendu: (e) => (
        <span className="font-mono text-xs text-gray-700 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
          {e.periode}
        </span>
      ),
    },
    {
      cle: 'dateLimite',
      entete: 'Échéance légale',
      rendu: (e) => <span className="text-xs text-gray-600">{formaterDateFr(e.dateLimite)}</span>,
    },
    {
      cle: 'statut',
      entete: 'Statut du dépôt',
      rendu: (e) => {
        if (e.statut === 'DEPOT_EFFECTUE') {
          const estDepotTardif = Boolean(e.dateDepot && e.dateDepot > e.dateLimite);
          return (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                estDepotTardif
                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              <span>{estDepotTardif ? '⚠️ Dépôt tardif' : '✓ Déposé'}</span>
              {e.dateDepot && <span className="font-mono text-[9px]">({formaterDateFr(e.dateDepot)})</span>}
            </span>
          );
        }
        if (e.enRetard) {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-800 border border-red-200 px-2.5 py-0.5 text-[10px] font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
              Non déposé (+{e.joursDeRetard}j)
            </span>
          );
        }
        return (
          <span className="rounded-full bg-blue-100 text-blue-800 px-2.5 py-0.5 text-[10px] font-medium">
            En attente
          </span>
        );
      },
    },
    {
      cle: 'montantDeclare',
      entete: 'Montant déclaré',
      rendu: (e) => (
        <span className="font-mono font-bold text-gray-900 text-xs">
          {e.montantDeclare != null ? formaterMontant(e.montantDeclare) : '-'}
        </span>
      ),
      alignementDroite: true,
    },
    {
      cle: 'actions' as const,
      entete: 'Actions',
      rendu: (e: EcheanceFiscale) => (
        <div className="flex gap-1.5 justify-end">
          {e.statut !== 'DEPOT_EFFECTUE' && (
            <button
              type="button"
              onClick={() => ouvrirModalDeclaration(e)}
              className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-fiscal-bordeaux hover:bg-gray-50 transition-colors shadow-2xs"
            >
              📝 Déposer
            </button>
          )}
          {e.enRetard && e.statut !== 'DEPOT_EFFECTUE' && (
            <button
              type="button"
              onClick={() => ouvrirModalRelance(e)}
              className="rounded-lg bg-fiscal-bordeaux hover:bg-fiscal-bordeauxFonce px-2 py-1 text-xs font-bold text-white transition-colors shadow-2xs"
            >
              📨 Relancer
            </button>
          )}
        </div>
      ),
      alignementDroite: true,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl">

      {/* ------------------------------------------------------------------- */}
      {/* 1. En-tête Principal & Titre Officiel DGI                          */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Échéances & Suivi des Déclarations
            </h1>
            <span className="rounded-full bg-red-100 text-red-800 px-2.5 py-0.5 text-xs font-bold font-mono">
              {defaillants.length} non-dépôt(s)
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Contrôle du calendrier déclaratif, détection instantanée des défaillances et notification officielle de relance.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void chargerDonnees()}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs"
        >
          <span>🔄</span> Actualiser les échéances
        </button>
      </div>

      {erreur && (
        <div className="rounded-2xl border border-red-200 bg-red-50/80 p-4 text-xs sm:text-sm text-red-700 font-semibold flex items-center gap-2">
          <span>⚠️</span> {erreur}
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 2. Cartes KPIs Métier Déclaratif                                   */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Échéances Légales */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Échéances Sous Contrôle
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 text-sm">
              📋
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {kpi.total}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Calendrier fiscal actif consolidé
          </p>
        </div>

        {/* Défaillances Non-dépôt */}
        <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50/70 via-white to-white p-4 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-700">
              Défaillants (Non-dépôt)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-100 text-red-700 text-sm">
              🚨
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-red-700 font-mono">
            {kpi.nbDefaillants}
          </div>
          <p className="text-[11px] text-red-600 mt-1 font-medium">
            Déclarations manquantes après délai
          </p>
        </div>

        {/* Déclarations Déposées */}
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-white to-white p-4 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Déclarations Enregistrées
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 text-sm">
              ✅
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
            {kpi.nbDeposes}
          </div>
          <p className="text-[11px] text-emerald-700 mt-1">
            Télédéclarations e-Hetra ou guichet
          </p>
        </div>

        {/* Taux de Civisme Déclaratif */}
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/70 via-white to-white p-4 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
              Civisme Déclaratif
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-700 text-sm">
              📈
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-blue-700 font-mono">
            {kpi.tauxConformite.toFixed(1)}%
          </div>
          {/* Mini barre */}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-blue-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, kpi.tauxConformite))}%` }}
            />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 3. Onglets de Navigation Principale                                 */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex items-center gap-1.5 border-b border-gray-200 text-xs sm:text-sm">
        <button
          type="button"
          onClick={() => setOngletActif('defaillants')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 font-bold transition-all ${
            ongletActif === 'defaillants'
              ? 'border-red-600 text-red-700 bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <span>🚨 Contribuables Défaillants (Non-dépôt)</span>
          <span className="rounded-full bg-red-100 text-red-800 px-2 py-0.5 text-xs font-black font-mono">
            {defaillants.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setOngletActif('toutes')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 font-semibold transition-all ${
            ongletActif === 'toutes'
              ? 'border-fiscal-bordeaux text-fiscal-bordeaux bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <span>📋 Registre de Toutes les Échéances Légales</span>
          <span className="rounded-full bg-gray-100 text-gray-700 px-2 py-0.5 text-xs font-mono">
            {echeances.length}
          </span>
        </button>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 4. Barre de Recherche et Filtres Dynamiques                        */}
      {/* ------------------------------------------------------------------- */}
      <div className="rounded-2xl border border-gray-200/90 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
          {/* Recherche */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 pointer-events-none">
              🔍
            </span>
            <input
              type="text"
              placeholder="Rechercher par contribuable, NIF, impôt, période…"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-slate-50/50 pl-9 pr-8 py-2 text-xs sm:text-sm focus:border-fiscal-bordeaux focus:bg-white focus:outline-none focus:ring-2 focus:ring-fiscal-bordeaux/15 transition-all"
            />
            {recherche && (
              <button
                type="button"
                onClick={() => setRecherche('')}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtres secondaires */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filtre Impôt */}
            <select
              value={filtreImpot}
              onChange={(e) => setFiltreImpot(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 focus:border-fiscal-bordeaux focus:outline-none"
            >
              <option value="TOUS">Tous les impôts</option>
              {listeCodesImpots.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>

            {/* Filtre Retard pour les défaillants */}
            {ongletActif === 'defaillants' && (
              <select
                value={filtreRetard}
                onChange={(e) => setFiltreRetard(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 focus:border-fiscal-bordeaux focus:outline-none"
              >
                <option value="TOUS">Tous les retards</option>
                <option value="PLUS_60">🔴 Retard critique (&gt; 60 jours)</option>
                <option value="30_60">🟡 Retard modéré (30 à 60 jours)</option>
                <option value="MOINS_30">🟢 Retard récent (&lt; 30 jours)</option>
              </select>
            )}

            {/* Bascule Vue Tableau / Cartes */}
            {ongletActif === 'defaillants' && (
              <div className="flex rounded-xl border border-gray-200 bg-gray-100 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setModeVue('table')}
                  className={`p-1.5 rounded-lg transition-all ${
                    modeVue === 'table' ? 'bg-white text-fiscal-bordeaux shadow-2xs font-bold' : 'text-gray-500 hover:text-gray-800'
                  }`}
                  title="Vue Tableau (Desktop)"
                >
                  📋
                </button>
                <button
                  type="button"
                  onClick={() => setModeVue('cartes')}
                  className={`p-1.5 rounded-lg transition-all ${
                    modeVue === 'cartes' ? 'bg-white text-fiscal-bordeaux shadow-2xs font-bold' : 'text-gray-500 hover:text-gray-800'
                  }`}
                  title="Vue Cartes (Mobile/Tablette)"
                >
                  📱
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Indicateur de résultats */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-100">
          <div>
            Affichage de <span className="font-bold text-gray-900">{donneesPaginees.length}</span> sur{' '}
            <span className="font-bold text-gray-900">{donneesFiltrees.length}</span> dossiers
          </div>
          {(recherche || filtreImpot !== 'TOUS' || filtreRetard !== 'TOUS') && (
            <button
              type="button"
              onClick={() => {
                setRecherche('');
                setFiltreImpot('TOUS');
                setFiltreRetard('TOUS');
              }}
              className="text-fiscal-bordeaux font-medium hover:underline"
            >
              Effacer les filtres
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 5. Affichage des Données (Vue Tableau ou Cartes Mobiles)            */}
      {/* ------------------------------------------------------------------- */}
      {ongletActif === 'defaillants' && modeVue === 'cartes' && !chargement ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {donneesPaginees.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500">
              Aucun contribuable défaillant ne correspond aux filtres.
            </div>
          ) : (
            donneesPaginees.map((e) => (
              <div
                key={e.id}
                className="flex flex-col justify-between rounded-2xl border border-red-200 bg-white p-4 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-800 font-bold text-xs">
                        {getInitiales(e.contribuableNom)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 leading-tight">
                          {e.contribuableNom}
                        </h4>
                        <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                          NIF: {e.contribuableNif}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        e.statut === 'RELANCE'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}
                    >
                      {e.statut === 'RELANCE' ? 'RELANCÉ' : 'NON DÉPOSÉ'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-2.5 text-xs mb-3">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Impôt</span>
                      <span className="font-bold text-gray-800">{e.impotCode}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Période</span>
                      <span className="font-mono text-gray-700">{e.periode}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Échéance</span>
                      <span className="text-gray-700">{formaterDateFr(e.dateLimite)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Retard</span>
                      <span className="font-bold text-red-700">+{e.joursDeRetard} jours</span>
                    </div>
                  </div>
                </div>

                {/* Actions cartes */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => void telechargerPdf(e.id)}
                      className="rounded-lg border border-gray-200 p-1.5 text-xs text-gray-600 hover:text-fiscal-bordeaux"
                      title="Télécharger PDF"
                    >
                      📄
                    </button>
                    <button
                      type="button"
                      onClick={() => void apercuPdf(e.id)}
                      className="rounded-lg border border-blue-200 bg-blue-50/50 p-1.5 text-xs text-blue-700 hover:bg-blue-100"
                      title="Aperçu PDF"
                    >
                      👁️
                    </button>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => ouvrirModalDeclaration(e)}
                      className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      📝 Déclarer
                    </button>
                    <button
                      type="button"
                      onClick={() => ouvrirModalRelance(e)}
                      className="rounded-lg bg-fiscal-bordeaux hover:bg-fiscal-bordeauxFonce px-3 py-1 text-xs font-bold text-white shadow-2xs"
                    >
                      📨 Relancer
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <Table
          colonnes={ongletActif === 'defaillants' ? colonnesDefaillants : colonnesToutes}
          donnees={donneesPaginees}
          cleLigne={(e) => e.id}
          chargement={chargement}
          messageVide={
            ongletActif === 'defaillants'
              ? 'Aucun contribuable défaillant ne correspond aux critères.'
              : 'Aucune échéance fiscale enregistrée.'
          }
        />
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 6. Pagination Contrôlée                                             */}
      {/* ------------------------------------------------------------------- */}
      {donneesFiltrees.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-gray-200/90 bg-white p-3.5 shadow-xs text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span>Dossiers par page :</span>
            <select
              value={elementsParPage}
              onChange={(e) => {
                setElementsParPage(Number(e.target.value));
                setPageCourante(1);
              }}
              className="rounded-lg border border-gray-200 bg-white px-2 py-1 font-semibold focus:border-fiscal-bordeaux"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-gray-400">|</span>
            <span>
              Page <span className="font-bold text-gray-900">{pageCourante}</span> sur{' '}
              <span className="font-bold text-gray-900">{totalPages}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={pageCourante <= 1}
              onClick={() => setPageCourante(1)}
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Première page"
            >
              ««
            </button>
            <button
              type="button"
              disabled={pageCourante <= 1}
              onClick={() => setPageCourante((p) => p - 1)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Précédent
            </button>
            <button
              type="button"
              disabled={pageCourante >= totalPages}
              onClick={() => setPageCourante((p) => p + 1)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Suivant →
            </button>
            <button
              type="button"
              disabled={pageCourante >= totalPages}
              onClick={() => setPageCourante(totalPages)}
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Dernière page"
            >
              »»
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Modal Relance Défaillant (SMS + Lettre PDF DGI)              */}
      {/* ============================================================ */}
      <Modal
        ouverte={echeanceARelancer !== null}
        titre="Relance pour Non-Dépôt de Déclaration"
        sousTitre={`Mise en demeure officielle pour ${echeanceARelancer?.contribuableNom}`}
        icone={<span>📨</span>}
        taille="2xl"
        onFermer={() => setEcheanceARelancer(null)}
        pied={
          <>
            <Button
              variante="secondaire"
              onClick={() => echeanceARelancer && telechargerPdf(echeanceARelancer.id)}
            >
              📄 Télécharger PDF DGI
            </Button>
            <Button
              onClick={gererRelance}
              enCours={relanceEnCours}
              className="bg-fiscal-bordeaux hover:bg-fiscal-bordeauxFonce font-bold px-5"
            >
              🚀 Envoyer la Relance
            </Button>
          </>
        }
      >
        {echeanceARelancer && (
          <div className="space-y-4">
            {/* Carte récapitulatif */}
            <div className="rounded-xl border border-red-200 bg-red-50/70 p-4 text-xs space-y-1">
              <div className="font-bold text-gray-900 text-sm">{echeanceARelancer.contribuableNom}</div>
              <div className="text-gray-600">
                NIF: <span className="font-mono font-semibold">{echeanceARelancer.contribuableNif}</span> | Téléphone :{' '}
                <span className="font-semibold">{echeanceARelancer.contribuableTelephone || 'Non renseigné'}</span> | Email :{' '}
                <span className="font-semibold">{echeanceARelancer.contribuableEmail || 'Non renseigné'}</span>
              </div>
              <div className="pt-1 text-red-700 font-medium">
                Impôt : <strong>{echeanceARelancer.impotLibelle} ({echeanceARelancer.impotCode})</strong> | Période : {echeanceARelancer.periode} | Échéance dépassée de{' '}
                <strong className="text-red-900">+{echeanceARelancer.joursDeRetard} jour(s)</strong>
              </div>
            </div>

            {/* Choix du canal */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Canal d’expédition
              </label>
              <select
                value={canalRelance}
                onChange={(e) => setCanalRelance(e.target.value as 'SMS' | 'EMAIL' | 'SMS_ET_EMAIL')}
                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:border-fiscal-bordeaux focus:outline-none focus:ring-2 focus:ring-fiscal-bordeaux/20"
              >
                <option value="EMAIL">Email uniquement (Recommandé — 100% opérationnel avec PDF DGI)</option>
                <option value="SMS_ET_EMAIL">SMS + Email (Email fonctionnel, SMS ⚠️ crédits requis)</option>
                <option value="SMS">SMS uniquement (⚠️ Crédits Brevo requis — distribution non garantie)</option>
              </select>
            </div>

            {/* Aperçu format SMS avec avertissement crédits */}
            {(canalRelance === 'SMS' || canalRelance === 'SMS_ET_EMAIL') && (
              <div className="space-y-2">
                <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-3 text-xs text-amber-950">
                  <div className="font-bold flex items-center gap-1.5 text-amber-950">
                    <span>⚠️</span> Distribution SMS non garantie
                  </div>
                  <p className="mt-1 text-[11px] text-amber-900 leading-relaxed">
                    Le compte Brevo actuel ne possède pas de crédits SMS transactionnels. Les SMS sont acceptés par l'API mais <strong>rejetés par les opérateurs téléphoniques Madagascar</strong>. Privilégiez le canal <strong>Email</strong> pour garantir la délivrance au contribuable.
                  </p>
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-3.5 text-xs">
                  <span className="font-bold text-blue-900 block mb-1">📱 Aperçu du SMS envoyé (GSM 160 car.) :</span>
                  <p className="text-blue-800 font-mono text-[11px] leading-relaxed">
                    Service Fiscal : Rappel - Vous n’avez pas encore déposé votre déclaration d’impôt{' '}
                    {echeanceARelancer.impotLibelle} ({echeanceARelancer.impotCode}) pour {echeanceARelancer.periode} échue le{' '}
                    {formaterDateFr(echeanceARelancer.dateLimite)}. Merci de régulariser sous 8 jours.
                  </p>
                </div>
              </div>
            )}

            {/* Texte de la lettre PDF */}
            {(canalRelance === 'EMAIL' || canalRelance === 'SMS_ET_EMAIL') && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Corps de la lettre officielle (DGI Madagascar)
                </label>
                <textarea
                  rows={4}
                  value={messagePersonnalise}
                  onChange={(e) => setMessagePersonnalise(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white p-3 text-xs font-sans focus:border-fiscal-bordeaux focus:outline-none focus:ring-2 focus:ring-fiscal-bordeaux/20"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Mentions incluses automatiquement dans le PDF : Référence officielle DGI, articles 20.03.02 et 20.01.53, mise en demeure sous 8 jours.
                </p>
              </div>
            )}

            {messageSuccesRelance && (
              <div className="rounded-xl bg-emerald-50 p-3.5 text-xs text-emerald-800 border border-emerald-200 font-semibold flex items-center gap-2">
                <span>✓</span> {messageSuccesRelance}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ============================================================ */}
      {/* Modal Enregistrement de Déclaration Fiscale                  */}
      {/* ============================================================ */}
      <Modal
        ouverte={echeanceADeclarer !== null}
        titre="Enregistrer le dépôt de déclaration fiscale"
        sousTitre={`Régularisation pour ${echeanceADeclarer?.contribuableNom}`}
        icone={<span>📝</span>}
        taille="xl"
        onFermer={() => setEcheanceADeclarer(null)}
        pied={
          <>
            <Button variante="secondaire" onClick={() => setEcheanceADeclarer(null)}>
              Annuler
            </Button>
            <Button
              onClick={gererDeclaration}
              enCours={declarationEnCours}
              className="bg-emerald-600 hover:bg-emerald-700 font-bold px-5"
            >
              Valider le dépôt
            </Button>
          </>
        }
      >
        {echeanceADeclarer && (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-slate-50 p-3 text-xs space-y-1">
              <span className="font-bold text-gray-900 text-sm block">{echeanceADeclarer.contribuableNom}</span>
              <div className="text-gray-600">
                Impôt : <strong>{echeanceADeclarer.impotLibelle}</strong> | Période : {echeanceADeclarer.periode} | Échéance légale :{' '}
                {formaterDateFr(echeanceADeclarer.dateLimite)}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Date effective de dépôt <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formDeclaration.dateDepot}
                  onChange={(e) => setFormDeclaration({ ...formDeclaration, dateDepot: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-fiscal-bordeaux focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Montant déclaré (Ar)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formDeclaration.montantDeclare ?? ''}
                  onChange={(e) =>
                    setFormDeclaration({
                      ...formDeclaration,
                      montantDeclare: e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                  placeholder="ex: 250000"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-mono focus:border-fiscal-bordeaux focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Méthode de dépôt
              </label>
              <select
                value={formDeclaration.methodeDepot}
                onChange={(e) => setFormDeclaration({ ...formDeclaration, methodeDepot: e.target.value })}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-fiscal-bordeaux focus:outline-none"
              >
                <option value="TELEDECLARATION_EHETRA">Télédéclaration en ligne (e-Hetra)</option>
                <option value="GUICHET_PHYSIQUE">Dépôt physique au guichet</option>
                <option value="VIREMENT_BANCAIRE">Virement bancaire / Bordereau</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Référence accusé de réception
              </label>
              <input
                type="text"
                value={formDeclaration.refAccuseReception ?? ''}
                onChange={(e) => setFormDeclaration({ ...formDeclaration, refAccuseReception: e.target.value })}
                placeholder="ex: REC-2026-987654"
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-mono focus:border-fiscal-bordeaux focus:outline-none"
              />
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
