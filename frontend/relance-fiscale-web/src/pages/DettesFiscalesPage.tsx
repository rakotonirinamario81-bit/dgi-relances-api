import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { DetteFiscaleTable } from '@/components/metier/DetteFiscaleTable';
import { detteFiscaleService } from '@/services/detteFiscaleService';
import { contribuableService } from '@/services/contribuableService';
import { apiClient, extraireMessageErreur } from '@/services/apiClient';
import { useDebounce } from '@/hooks/useDebounce';
import type { DetteFiscale, DetteFiscaleDTO, DetteFiscaleMiseAJourDTO } from '@/types/detteFiscale.types';
import type { Impot } from '@/types/impot.types';
import type { Contribuable } from '@/types/contribuable.types';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ModalCalculPenalites } from '@/components/metier/ModalCalculPenalites';
import { rapportService } from '@/services/rapportService';
import { formaterMontant } from '@/utils/formatDate';

// ---------------------------------------------------------------------------
// Helpers — construction et décomposition de la période fiscale
// ---------------------------------------------------------------------------

type Periodicite = 'MENSUELLE' | 'BIMESTRIELLE' | 'TRIMESTRIELLE' | 'ANNUELLE';

const MOIS_LABELS = [
  'Janvier (01)', 'Février (02)', 'Mars (03)', 'Avril (04)', 'Mai (05)', 'Juin (06)',
  'Juillet (07)', 'Août (08)', 'Septembre (09)', 'Octobre (10)', 'Novembre (11)', 'Décembre (12)',
];

const BIMESTRES_LABELS = [
  'Bimestre 1 : Janv–Févr', 'Bimestre 2 : Mars–Avr', 'Bimestre 3 : Mai–Juin',
  'Bimestre 4 : Juil–Août', 'Bimestre 5 : Sept–Oct', 'Bimestre 6 : Nov–Déc',
];

const TRIMESTRES_LABELS = [
  { val: 'T1', label: 'T1 (1er Trimestre : Janv–Mars)' },
  { val: 'T2', label: 'T2 (2ème Trimestre : Avr–Juin)' },
  { val: 'T3', label: 'T3 (3ème Trimestre : Juil–Sept)' },
  { val: 'T4', label: 'T4 (4ème Trimestre : Oct–Déc)' },
];

function construirePeriode(periodicite: Periodicite, annee: string, sousperiode: string): string {
  if (!annee) return '';
  switch (periodicite) {
    case 'MENSUELLE':    return `${annee}-${sousperiode.padStart(2, '0')}`;
    case 'BIMESTRIELLE': return `B${sousperiode}-${annee}`;
    case 'TRIMESTRIELLE': return `${sousperiode}-${annee}`;
    case 'ANNUELLE':     return annee;
  }
}

function decomposerPeriode(periode: string): {
  periodicite: Periodicite;
  annee: string;
  sousperiode: string;
} {
  if (/^\d{4}$/.test(periode)) return { periodicite: 'ANNUELLE', annee: periode, sousperiode: '' };
  if (/^\d{4}-\d{2}$/.test(periode)) {
    const [annee, mois] = periode.split('-');
    return { periodicite: 'MENSUELLE', annee, sousperiode: String(Number(mois)) };
  }
  if (/^T[1-4]-\d{4}$/.test(periode)) {
    const [trim, annee] = periode.split('-');
    return { periodicite: 'TRIMESTRIELLE', annee, sousperiode: trim };
  }
  if (/^B[1-6]-\d{4}$/.test(periode)) {
    const [bim, annee] = periode.split('-');
    return { periodicite: 'BIMESTRIELLE', annee, sousperiode: bim.replace('B', '') };
  }
  return { periodicite: 'ANNUELLE', annee: periode, sousperiode: '' };
}

// ---------------------------------------------------------------------------
// Composant Sélecteur de Période Fiscale
// ---------------------------------------------------------------------------

interface PeriodeFiscaleSelectProps {
  periodicite: Periodicite;
  annee: string;
  sousperiode: string;
  onPeriodiciteChange: (v: Periodicite) => void;
  onAnneeChange: (v: string) => void;
  onSousperiodeChange: (v: string) => void;
}

function PeriodeFiscaleSelect({
  periodicite, annee, sousperiode,
  onPeriodiciteChange, onAnneeChange, onSousperiodeChange,
}: PeriodeFiscaleSelectProps) {
  const anneeActuelle = new Date().getFullYear();
  const annees = Array.from({ length: 8 }, (_, i) => String(anneeActuelle - 2 + i));

  return (
    <div className="space-y-2 rounded-xl border border-gray-200/80 bg-slate-50/50 p-3.5">
      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
        Période Fiscale d'Assiette
      </label>

      {/* Boutons périodicité */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-gray-200/60 rounded-lg text-xs">
        {(['ANNUELLE', 'TRIMESTRIELLE', 'MENSUELLE', 'BIMESTRIELLE'] as Periodicite[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPeriodiciteChange(p)}
            className={`py-1.5 px-2 rounded-md font-medium text-center transition-all ${
              periodicite === p
                ? 'bg-white text-fiscal-bordeaux shadow-xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {p === 'ANNUELLE' ? 'Annuelle' : p === 'TRIMESTRIELLE' ? 'Trimestre' : p === 'MENSUELLE' ? 'Mensuelle' : 'Bimestre'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        {/* Année */}
        <div>
          <label className="block text-[11px] font-medium text-gray-500 mb-1">Exercice / Année</label>
          <select
            value={annee}
            onChange={(e) => onAnneeChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-fiscal-bordeaux focus:ring-1 focus:ring-fiscal-bordeaux"
          >
            <option value="">Sélectionner l'année…</option>
            {annees.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        {/* Sous-période */}
        {periodicite !== 'ANNUELLE' && (
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">
              {periodicite === 'MENSUELLE' ? 'Mois d’échéance' : periodicite === 'TRIMESTRIELLE' ? 'Trimestre fiscal' : 'Bimestre'}
            </label>
            <select
              value={sousperiode}
              onChange={(e) => onSousperiodeChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-fiscal-bordeaux focus:ring-1 focus:ring-fiscal-bordeaux"
            >
              <option value="">-- Choisir la division --</option>
              {periodicite === 'MENSUELLE' &&
                MOIS_LABELS.map((libelle, idx) => (
                  <option key={idx + 1} value={String(idx + 1)}>
                    {libelle}
                  </option>
                ))}
              {periodicite === 'BIMESTRIELLE' &&
                BIMESTRES_LABELS.map((libelle, idx) => (
                  <option key={idx + 1} value={String(idx + 1)}>
                    {libelle}
                  </option>
                ))}
              {periodicite === 'TRIMESTRIELLE' &&
                TRIMESTRES_LABELS.map((t) => (
                  <option key={t.val} value={t.val}>
                    {t.label}
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      {annee && (periodicite === 'ANNUELLE' || sousperiode) && (
        <div className="flex items-center gap-2 pt-1 text-xs text-gray-600">
          <span className="text-[11px] font-medium text-gray-400">Identifiant d'échéance :</span>
          <span className="inline-flex items-center rounded-md bg-fiscal-bordeaux/10 px-2 py-0.5 font-mono font-bold text-fiscal-bordeaux">
            {construirePeriode(periodicite, annee, sousperiode)}
          </span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composant Recherche de Contribuable avec Auto-complétion & Cartouche
// ---------------------------------------------------------------------------

interface RechercheContribuableProps {
  contribuableSelectionne: Contribuable | null;
  onSelectionner: (c: Contribuable | null) => void;
  lectureSeule?: boolean;
}

function RechercheContribuable({
  contribuableSelectionne,
  onSelectionner,
  lectureSeule = false,
}: RechercheContribuableProps) {
  const [recherche, setRecherche] = useState('');
  const [suggestions, setSuggestions] = useState<Contribuable[]>([]);
  const [ouvert, setOuvert] = useState(false);
  const [chargement, setChargement] = useState(false);
  const rechercheDebounce = useDebounce(recherche, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lectureSeule) return;
    if (rechercheDebounce.trim().length < 2) {
      setSuggestions([]);
      setOuvert(false);
      return;
    }
    setChargement(true);
    contribuableService
      .rechercher({ nom: rechercheDebounce, size: 8 })
      .then((page) => {
        setSuggestions(page.content);
        setOuvert(true);
      })
      .catch(() => setSuggestions([]))
      .finally(() => setChargement(false));
  }, [rechercheDebounce, lectureSeule]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOuvert(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (contribuableSelectionne) {
    return (
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
          Contribuable Redevable
        </label>
        <div className="flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50/70 p-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-xs">
              {contribuableSelectionne.typeContribuable === 'PERSONNE_MORALE' ? '🏢' : '👤'}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">
                {contribuableSelectionne.nomAffichage}
              </p>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                <span className="font-mono font-medium text-emerald-800">
                  NIF : {contribuableSelectionne.nif}
                </span>
                {contribuableSelectionne.commune && (
                  <span>• {contribuableSelectionne.commune}</span>
                )}
              </div>
            </div>
          </div>
          {!lectureSeule && (
            <button
              type="button"
              onClick={() => {
                onSelectionner(null);
                setRecherche('');
              }}
              className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors shadow-2xs"
            >
              Changer
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
        Sélection du Contribuable <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 pointer-events-none">
          🔍
        </span>
        <input
          type="text"
          placeholder="Rechercher par nom de société, nom ou NIF (min. 2 caractères)…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="w-full rounded-xl border border-gray-300 bg-white pl-9 pr-8 py-2.5 text-sm focus:border-fiscal-bordeaux focus:outline-none focus:ring-2 focus:ring-fiscal-bordeaux/20 transition-all"
        />
        {chargement && (
          <span className="absolute inset-y-0 right-0 flex items-center pr-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-fiscal-bordeaux border-t-transparent" />
          </span>
        )}
      </div>

      {ouvert && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1.5 w-full rounded-xl border border-gray-200 bg-white py-1 shadow-xl max-h-60 overflow-y-auto divide-y divide-gray-100">
          {suggestions.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between px-3.5 py-2.5 cursor-pointer hover:bg-fiscal-bordeaux hover:text-white transition-colors group"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelectionner(c);
                setOuvert(false);
                setRecherche('');
              }}
            >
              <div>
                <span className="font-semibold text-sm group-hover:text-white block">
                  {c.nomAffichage}
                </span>
                <span className="text-xs text-gray-500 group-hover:text-white/80 font-mono">
                  NIF : {c.nif} {c.commune ? `• ${c.commune}` : ''}
                </span>
              </div>
              <span className="text-xs text-gray-400 group-hover:text-white/80">
                Choisir →
              </span>
            </li>
          ))}
        </ul>
      )}

      {ouvert && !chargement && suggestions.length === 0 && recherche.length >= 2 && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-gray-200 bg-white p-4 text-center text-sm text-gray-500 shadow-xl">
          Aucun contribuable trouvé pour « {recherche} »
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formulaire de Dette Fiscale
// ---------------------------------------------------------------------------

interface EtatFormulaire {
  periodicite: Periodicite;
  annee: string;
  sousperiode: string;
  impotId: number;
  montantDu: number | '';
  dateEcheance: string;
}

const FORMULAIRE_VIDE: EtatFormulaire = {
  periodicite: 'ANNUELLE',
  annee: String(new Date().getFullYear()),
  sousperiode: '',
  impotId: 0,
  montantDu: '',
  dateEcheance: '',
};

// ---------------------------------------------------------------------------
// Page Principale DettesFiscalesPage
// ---------------------------------------------------------------------------

export function DettesFiscalesPage() {
  const [dettes, setDettes] = useState<DetteFiscale[]>([]);
  const [chargement, setChargement] = useState(true);
  const [impots, setImpots] = useState<Impot[]>([]);

  // Filtres et recherche
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState<string>('TOUS');
  const [filtreImpotId, setFiltreImpotId] = useState<number | 'TOUS'>('TOUS');
  const [filtreRisque, setFiltreRisque] = useState<string>('TOUS');
  const [ordreTri, setOrdreTri] = useState<'RECENT' | 'SOLDE_DESC' | 'RETARD_DESC' | 'NOM_ASC'>('RECENT');
  const [modeVue, setModeVue] = useState<'table' | 'cartes'>('table');

  // Pagination client
  const [pageCourante, setPageCourante] = useState(1);
  const [elementsParPage, setElementsParPage] = useState(25);

  // Modale création/modification
  const [modeModal, setModeModal] = useState<'creation' | 'modification' | null>(null);
  const [detteEnCours, setDetteEnCours] = useState<DetteFiscale | null>(null);
  const [contribuableSelectionne, setContribuableSelectionne] = useState<Contribuable | null>(null);
  const [formulaire, setFormulaire] = useState<EtatFormulaire>(FORMULAIRE_VIDE);
  const [erreurFormulaire, setErreurFormulaire] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  // Modale suppression
  const [detteASupprimer, setDetteASupprimer] = useState<DetteFiscale | null>(null);
  const [suppressionEnCours, setSuppresionEnCours] = useState(false);
  const [erreurSuppression, setErreurSuppression] = useState<string | null>(null);

  // Modale calcul pénalités CGI
  const [detteCalculPenalite, setDetteCalculPenalite] = useState<DetteFiscale | null>(null);

  // Chargement des données
  const chargerDonnees = useCallback(async () => {
    setChargement(true);
    try {
      const [impotsData, dettesData] = await Promise.all([
        apiClient.get<Impot[]>('/impots').then((r) => r.data),
        detteFiscaleService.listerToutes(),
      ]);
      setImpots(impotsData);
      setDettes(dettesData);
    } catch (err) {
      console.error('Erreur chargement données dettes:', err);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void chargerDonnees();
  }, [chargerDonnees]);

  // -------------------------------------------------------------------------
  // KPI Calculés (Temps Réel)
  // -------------------------------------------------------------------------
  const kpi = useMemo(() => {
    const totalDettes = dettes.length;
    const montantTotalEmis = dettes.reduce((acc, d) => acc + (d.montantDu || 0), 0);
    const soldeRestantTotal = dettes.reduce((acc, d) => acc + (d.soldeRestant || 0), 0);
    const dettesEnRetard = dettes.filter((d) => d.joursDeRetard > 0 && d.statut !== 'PAYE' && d.statut !== 'CLOTURE').length;
    const totalPenalites = dettes.reduce(
      (acc, d) => acc + ((d.penalitesRetard || 0) + (d.interetsRetard || 0) - (d.remiseGracieuse || 0)),
      0
    );

    return {
      totalDettes,
      montantTotalEmis,
      soldeRestantTotal,
      dettesEnRetard,
      totalPenalites,
    };
  }, [dettes]);

  // -------------------------------------------------------------------------
  // Filtrage et Tri Optimisés
  // -------------------------------------------------------------------------
  const dettesFiltrees = useMemo(() => {
    return dettes
      .filter((d) => {
        // Recherche textuelle (Nom, NIF, Impôt, Période)
        if (recherche.trim()) {
          const query = recherche.toLowerCase();
          const matchNom = d.nomContribuable?.toLowerCase().includes(query);
          const matchImpot = d.impot?.toLowerCase().includes(query);
          const matchPeriode = d.periodeFiscale?.toLowerCase().includes(query);
          const matchId = String(d.id).includes(query);
          if (!matchNom && !matchImpot && !matchPeriode && !matchId) return false;
        }

        // Filtre Statut
        if (filtreStatut !== 'TOUS') {
          if (filtreStatut === 'EN_RETARD') {
            if (d.joursDeRetard <= 0 || d.statut === 'PAYE' || d.statut === 'CLOTURE') return false;
          } else if (filtreStatut === 'A_PAYER') {
            if (d.statut !== 'A_PAYER') return false;
          } else if (filtreStatut === 'PROCEDURE') {
            if (d.statut !== 'EN_PROCEDURE_RECOUVREMENT') return false;
          } else if (filtreStatut === 'SOLDE') {
            if (d.statut !== 'PAYE' && d.statut !== 'CLOTURE') return false;
          }
        }

        // Filtre Impôt
        if (filtreImpotId !== 'TOUS') {
          if (d.impotId !== filtreImpotId) return false;
        }

        // Filtre Risque
        if (filtreRisque !== 'TOUS') {
          if (d.niveauRisque !== filtreRisque) return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (ordreTri) {
          case 'SOLDE_DESC':
            return (b.soldeRestant || 0) - (a.soldeRestant || 0);
          case 'RETARD_DESC':
            return b.joursDeRetard - a.joursDeRetard;
          case 'NOM_ASC':
            return a.nomContribuable.localeCompare(b.nomContribuable);
          case 'RECENT':
          default:
            return b.id - a.id;
        }
      });
  }, [dettes, recherche, filtreStatut, filtreImpotId, filtreRisque, ordreTri]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(dettesFiltrees.length / elementsParPage));
  const dettesPaginees = useMemo(() => {
    const debut = (pageCourante - 1) * elementsParPage;
    return dettesFiltrees.slice(debut, debut + elementsParPage);
  }, [dettesFiltrees, pageCourante, elementsParPage]);

  // Reset page si filtre change
  useEffect(() => {
    setPageCourante(1);
  }, [recherche, filtreStatut, filtreImpotId, filtreRisque]);

  // -------------------------------------------------------------------------
  // Actions Modales
  // -------------------------------------------------------------------------
  function ouvrirCreation() {
    setDetteEnCours(null);
    setContribuableSelectionne(null);
    setFormulaire(FORMULAIRE_VIDE);
    setErreurFormulaire(null);
    setModeModal('creation');
  }

  async function ouvrirModification(dette: DetteFiscale) {
    setDetteEnCours(dette);
    setErreurFormulaire(null);

    try {
      const contrib = await contribuableService.obtenirParId(dette.contribuableId);
      setContribuableSelectionne(contrib);
    } catch {
      setContribuableSelectionne({
        id: dette.contribuableId,
        nomAffichage: dette.nomContribuable,
        nif: '',
        typeContribuable: 'PERSONNE_PHYSIQUE',
        nomOuRaisonSociale: dette.nomContribuable,
        nombreDettesActives: 0,
      });
    }

    const { periodicite, annee, sousperiode } = decomposerPeriode(dette.periodeFiscale);
    setFormulaire({
      periodicite,
      annee,
      sousperiode,
      impotId: dette.impotId,
      montantDu: dette.montantDu,
      dateEcheance: dette.dateEcheance,
    });
    setModeModal('modification');
  }

  function fermerModal() {
    setModeModal(null);
    setDetteEnCours(null);
    setContribuableSelectionne(null);
    setFormulaire(FORMULAIRE_VIDE);
    setErreurFormulaire(null);
  }

  function validerFormulaire(): string | null {
    if (modeModal === 'creation' && !contribuableSelectionne) return 'Veuillez sélectionner un contribuable.';
    if (!formulaire.impotId) return "Veuillez sélectionner un type d'impôt.";
    if (!formulaire.annee) return "Veuillez préciser l'année fiscale d'exercice.";
    if (formulaire.periodicite !== 'ANNUELLE' && !formulaire.sousperiode) return 'Veuillez choisir la division sous-périodique.';
    if (!formulaire.montantDu || Number(formulaire.montantDu) <= 0) return 'Le montant dû doit être supérieur à zéro Ariary.';
    if (!formulaire.dateEcheance) return "Veuillez indiquer la date d'échéance légale.";
    return null;
  }

  async function gererCreation() {
    const erreur = validerFormulaire();
    if (erreur) { setErreurFormulaire(erreur); return; }
    setEnCours(true);
    setErreurFormulaire(null);
    try {
      const periodeFiscale = construirePeriode(formulaire.periodicite, formulaire.annee, formulaire.sousperiode);
      const dto: DetteFiscaleDTO = {
        contribuableId: contribuableSelectionne!.id,
        impotId: formulaire.impotId,
        periodeFiscale,
        montantDu: Number(formulaire.montantDu),
        dateEcheance: formulaire.dateEcheance,
      };
      const creee = await detteFiscaleService.creer(dto);
      setDettes((prev) => [creee, ...prev]);
      fermerModal();
    } catch (err) {
      setErreurFormulaire(extraireMessageErreur(err));
    } finally {
      setEnCours(false);
    }
  }

  async function gererModification() {
    const erreur = validerFormulaire();
    if (erreur) { setErreurFormulaire(erreur); return; }
    if (!detteEnCours) return;
    setEnCours(true);
    setErreurFormulaire(null);
    try {
      const periodeFiscale = construirePeriode(formulaire.periodicite, formulaire.annee, formulaire.sousperiode);
      const dto: DetteFiscaleMiseAJourDTO = {
        impotId: formulaire.impotId,
        periodeFiscale,
        montantDu: Number(formulaire.montantDu),
        dateEcheance: formulaire.dateEcheance,
      };
      const misAJour = await detteFiscaleService.modifier(detteEnCours.id, dto);
      setDettes((prev) => prev.map((d) => (d.id === misAJour.id ? misAJour : d)));
      fermerModal();
    } catch (err) {
      setErreurFormulaire(extraireMessageErreur(err));
    } finally {
      setEnCours(false);
    }
  }

  async function confirmerSuppression() {
    if (!detteASupprimer) return;
    setSuppresionEnCours(true);
    setErreurSuppression(null);
    try {
      await detteFiscaleService.supprimer(detteASupprimer.id);
      setDettes((prev) => prev.filter((d) => d.id !== detteASupprimer.id));
      setDetteASupprimer(null);
    } catch (err) {
      setErreurSuppression(extraireMessageErreur(err));
    } finally {
      setSuppresionEnCours(false);
    }
  }

  // Presets date échéance rapide (+30j, +60j, fin du mois)
  function appliquerPresetEcheance(jours: number) {
    const d = new Date();
    d.setDate(d.getDate() + jours);
    setFormulaire((prev) => ({ ...prev, dateEcheance: d.toISOString().split('T')[0] }));
  }

  return (
    <div className="space-y-6 max-w-7xl">

      {/* ------------------------------------------------------------------- */}
      {/* En-tête Principal & Boutons d'Action                               */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Dettes Fiscales
            </h1>
            <span className="rounded-full bg-fiscal-bordeaux/10 text-fiscal-bordeaux px-2.5 py-0.5 text-xs font-bold font-mono">
              {dettes.length} dossiers
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Gestion du portefeuille de créances, liquidation des droits et décompte des pénalités légales (CGI).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variante="secondaire"
            onClick={() => void rapportService.telechargerDettesExcel()}
            className="text-xs shadow-xs"
          >
            📥 Export Excel (.xlsx)
          </Button>
          <Button
            variante="secondaire"
            onClick={() => void rapportService.telechargerDettesCsv()}
            className="text-xs shadow-xs"
          >
            📥 Export CSV
          </Button>
          <Button
            onClick={ouvrirCreation}
            className="text-xs shadow-sm bg-fiscal-bordeaux hover:bg-fiscal-bordeauxFonce font-semibold"
          >
            + Nouvelle dette fiscale
          </Button>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 4 Cartes KPI Financiers & Opérationnels                            */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Émis */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Créances Émises
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 text-sm">
              📋
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {formaterMontant(kpi.montantTotalEmis)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Sur l'ensemble des {kpi.totalDettes} dossiers fiscaux
          </p>
        </div>

        {/* Solde en souffrance */}
        <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50/70 to-white p-4 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-700">
              Solde Exigible Impayé
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-100 text-red-700 text-sm">
              💰
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-red-700 font-mono">
            {formaterMontant(kpi.soldeRestantTotal)}
          </div>
          <p className="text-[11px] text-red-600/80 mt-1">
            Créances fiscales nettes à recouvrer
          </p>
        </div>

        {/* Dossiers en retard */}
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/70 to-white p-4 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
              Dossiers en Retard
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-800 text-sm">
              ⚠️
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-amber-800 font-mono">
            {kpi.dettesEnRetard}
          </div>
          <p className="text-[11px] text-amber-700/80 mt-1">
            Échéance dépassée nécessitant relance
          </p>
        </div>

        {/* Pénalités Liquidées CGI */}
        <div className="rounded-2xl border border-fiscal-bordeaux/20 bg-gradient-to-br from-fiscal-bordeaux/5 to-white p-4 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-fiscal-bordeaux">
              Pénalités Liquidées CGI
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-fiscal-bordeaux/10 text-fiscal-bordeaux text-sm">
              ⚖️
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-fiscal-bordeaux font-mono">
            {formaterMontant(kpi.totalPenalites)}
          </div>
          <p className="text-[11px] text-fiscal-bordeaux/70 mt-1">
            Majorations 10% & Intérêts 1%/mois
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Barre d'Onglets de Statut Rapides                                   */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-b border-gray-200">
        {[
          { id: 'TOUS', label: 'Toutes les créances', count: dettes.length },
          { id: 'EN_RETARD', label: 'En retard', count: kpi.dettesEnRetard, badgeClass: 'bg-red-100 text-red-800' },
          { id: 'A_PAYER', label: 'À payer (en cours)', count: dettes.filter((d) => d.statut === 'A_PAYER').length },
          { id: 'PROCEDURE', label: 'Recouvrement forcé', count: dettes.filter((d) => d.statut === 'EN_PROCEDURE_RECOUVREMENT').length, badgeClass: 'bg-purple-100 text-purple-800' },
          { id: 'SOLDE', label: 'Soldées / Clôturées', count: dettes.filter((d) => d.statut === 'PAYE' || d.statut === 'CLOTURE').length, badgeClass: 'bg-emerald-100 text-emerald-800' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFiltreStatut(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg font-semibold transition-all whitespace-nowrap border-b-2 ${
              filtreStatut === tab.id
                ? 'border-fiscal-bordeaux text-fiscal-bordeaux bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                tab.badgeClass ?? (filtreStatut === tab.id ? 'bg-fiscal-bordeaux/10 text-fiscal-bordeaux' : 'bg-gray-100 text-gray-600')
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Barre de Recherche, Filtres Multi-critères et Tri                   */}
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
            {/* Filtre Nature d'impôt */}
            <select
              value={filtreImpotId}
              onChange={(e) => setFiltreImpotId(e.target.value === 'TOUS' ? 'TOUS' : Number(e.target.value))}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 focus:border-fiscal-bordeaux focus:outline-none"
            >
              <option value="TOUS">Tous les impôts</option>
              {impots.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.code} ({i.libelle})
                </option>
              ))}
            </select>

            {/* Filtre Risque IA */}
            <select
              value={filtreRisque}
              onChange={(e) => setFiltreRisque(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 focus:border-fiscal-bordeaux focus:outline-none"
            >
              <option value="TOUS">Tous les risques</option>
              <option value="RISQUE_ELEVE">🔴 Risque Élevé</option>
              <option value="RISQUE_MOYEN">🟡 Risque Moyen</option>
              <option value="RISQUE_FAIBLE">🟢 Risque Faible</option>
            </select>

            {/* Tri */}
            <select
              value={ordreTri}
              onChange={(e) => setOrdreTri(e.target.value as typeof ordreTri)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 focus:border-fiscal-bordeaux focus:outline-none"
            >
              <option value="RECENT">Plus récentes</option>
              <option value="SOLDE_DESC">Solde décroissant</option>
              <option value="RETARD_DESC">Retard le plus long</option>
              <option value="NOM_ASC">Nom contribuable (A-Z)</option>
            </select>

            {/* Bascule Vue Tableau / Cartes */}
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

            {/* Rafraîchir */}
            <button
              type="button"
              onClick={() => void chargerDonnees()}
              className="rounded-xl border border-gray-200 bg-white p-2 text-gray-600 hover:text-fiscal-bordeaux hover:bg-gray-50 transition-colors shadow-2xs"
              title="Actualiser les données"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Indicateur de résultats & Réinitialisation */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-100">
          <div>
            Affichage de <span className="font-bold text-gray-900">{dettesPaginees.length}</span> sur{' '}
            <span className="font-bold text-gray-900">{dettesFiltrees.length}</span> créances trouvées
            {dettesFiltrees.length !== dettes.length && ` (sur ${dettes.length} au total)`}
          </div>
          {(recherche || filtreStatut !== 'TOUS' || filtreImpotId !== 'TOUS' || filtreRisque !== 'TOUS') && (
            <button
              type="button"
              onClick={() => {
                setRecherche('');
                setFiltreStatut('TOUS');
                setFiltreImpotId('TOUS');
                setFiltreRisque('TOUS');
              }}
              className="text-fiscal-bordeaux font-medium hover:underline"
            >
              Effacer tous les filtres
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Tableau ou Cartes des Dettes Fiscales                               */}
      {/* ------------------------------------------------------------------- */}
      <DetteFiscaleTable
        dettes={dettesPaginees}
        chargement={chargement}
        messageVide={
          recherche || filtreStatut !== 'TOUS'
            ? 'Aucune créance fiscale ne correspond aux filtres appliqués.'
            : 'Aucune dette fiscale enregistrée dans la base.'
        }
        onModifier={ouvrirModification}
        onSupprimer={(d) => {
          setDetteASupprimer(d);
          setErreurSuppression(null);
        }}
        onCalculerPenalites={(d) => setDetteCalculPenalite(d)}
        modeVue={modeVue}
      />

      {/* ------------------------------------------------------------------- */}
      {/* Pagination Contrôlée                                                */}
      {/* ------------------------------------------------------------------- */}
      {dettesFiltrees.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-gray-200/90 bg-white p-3.5 shadow-xs text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span>Lignes par page :</span>
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
              <option value={100}>100</option>
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
      {/* Modal Création / Modification Complète                       */}
      {/* ============================================================ */}
      <Modal
        ouverte={modeModal !== null}
        titre={modeModal === 'modification' ? 'Modification de la Dette Fiscale' : 'Nouvelle Dette Fiscale'}
        sousTitre={
          modeModal === 'modification'
            ? `Ajustement du titre de perception Réf: DETTE-${detteEnCours?.id}`
            : "Émission d'un titre de créance fiscale ou mise en recouvrement d'office"
        }
        icone={<span>📜</span>}
        taille="2xl"
        onFermer={fermerModal}
        pied={
          <>
            <Button variante="secondaire" onClick={fermerModal}>
              Annuler
            </Button>
            <Button
              onClick={modeModal === 'modification' ? gererModification : gererCreation}
              enCours={enCours}
              className="bg-fiscal-bordeaux hover:bg-fiscal-bordeauxFonce font-bold px-5"
            >
              {modeModal === 'modification' ? 'Enregistrer les modifications' : 'Émettre la dette fiscale'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Sélection / rappel contribuable */}
          <RechercheContribuable
            contribuableSelectionne={contribuableSelectionne}
            onSelectionner={setContribuableSelectionne}
            lectureSeule={modeModal === 'modification'}
          />

          {/* Nature de l'impôt */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Nature de l'Impôt & Assiette <span className="text-red-500">*</span>
            </label>
            <select
              value={formulaire.impotId || ''}
              onChange={(e) => setFormulaire({ ...formulaire, impotId: Number(e.target.value) })}
              className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:border-fiscal-bordeaux focus:outline-none focus:ring-2 focus:ring-fiscal-bordeaux/20"
            >
              <option value="">Sélectionner une catégorie d'impôt…</option>
              {impots.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.code} — {i.libelle}
                </option>
              ))}
            </select>
          </div>

          {/* Période fiscale adaptative */}
          <PeriodeFiscaleSelect
            periodicite={formulaire.periodicite}
            annee={formulaire.annee}
            sousperiode={formulaire.sousperiode}
            onPeriodiciteChange={(v) => setFormulaire({ ...formulaire, periodicite: v, sousperiode: '' })}
            onAnneeChange={(v) => setFormulaire({ ...formulaire, annee: v })}
            onSousperiodeChange={(v) => setFormulaire({ ...formulaire, sousperiode: v })}
          />

          {/* Montant & Date dans une grille 2 colonnes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Montant en Principal Dû (Ariary) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  required
                  placeholder="Ex: 500000"
                  value={formulaire.montantDu}
                  onChange={(e) =>
                    setFormulaire({
                      ...formulaire,
                      montantDu: e.target.value === '' ? '' : Number(e.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white pl-3.5 pr-14 py-2.5 text-sm font-mono font-bold text-gray-900 focus:border-fiscal-bordeaux focus:outline-none focus:ring-2 focus:ring-fiscal-bordeaux/20"
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-xs font-bold text-gray-400 pointer-events-none">
                  MGA
                </span>
              </div>
              {formulaire.montantDu !== '' && Number(formulaire.montantDu) > 0 && (
                <p className="mt-1 text-[11px] text-gray-500 font-mono">
                  Soit {formaterMontant(Number(formulaire.montantDu))}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Date d'Échéance Légale <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formulaire.dateEcheance}
                onChange={(e) => setFormulaire({ ...formulaire, dateEcheance: e.target.value })}
                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:border-fiscal-bordeaux focus:outline-none focus:ring-2 focus:ring-fiscal-bordeaux/20"
              />
              {/* Presets rapides */}
              <div className="flex items-center gap-1.5 mt-1.5 text-[11px]">
                <span className="text-gray-400">Raccourcis :</span>
                <button
                  type="button"
                  onClick={() => appliquerPresetEcheance(30)}
                  className="rounded bg-gray-100 hover:bg-gray-200 px-1.5 py-0.5 text-gray-700 font-medium"
                >
                  +30 jours
                </button>
                <button
                  type="button"
                  onClick={() => appliquerPresetEcheance(60)}
                  className="rounded bg-gray-100 hover:bg-gray-200 px-1.5 py-0.5 text-gray-700 font-medium"
                >
                  +60 jours
                </button>
              </div>
            </div>
          </div>

          {/* Erreur de validation */}
          {erreurFormulaire && (
            <div className="rounded-xl border border-red-200 bg-red-50/90 p-3 text-xs text-red-700 flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span className="font-semibold">{erreurFormulaire}</span>
            </div>
          )}
        </div>
      </Modal>

      {/* ============================================================ */}
      {/* Dialog de confirmation de suppression                        */}
      {/* ============================================================ */}
      <ConfirmDialog
        ouverte={detteASupprimer !== null}
        titre="Supprimer la dette fiscale"
        message={
          detteASupprimer
            ? `Voulez-vous vraiment supprimer la dette de ${detteASupprimer.nomContribuable} (${detteASupprimer.impot} – ${detteASupprimer.periodeFiscale}) ? Cette action est irréversible et supprimera le dossier de recouvrement.`
            : ''
        }
        onConfirmer={confirmerSuppression}
        onAnnuler={() => {
          setDetteASupprimer(null);
          setErreurSuppression(null);
        }}
        enCours={suppressionEnCours}
        erreur={erreurSuppression}
      />

      {/* ============================================================ */}
      {/* Modal de calcul & liquidation des pénalités CGI              */}
      {/* ============================================================ */}
      {detteCalculPenalite && (
        <ModalCalculPenalites
          dette={detteCalculPenalite}
          isOpen={Boolean(detteCalculPenalite)}
          onClose={() => setDetteCalculPenalite(null)}
          onPenalitesAppliquees={() => {
            void chargerDonnees();
          }}
        />
      )}
    </div>
  );
}