import { useEffect, useState, useMemo, useCallback, type FormEvent } from 'react';
import { Button } from '@/components/common/Button';
import { StatutDetteBadge } from '@/components/metier/StatutDetteBadge';
import { RelanceTimeline } from '@/components/metier/RelanceTimeline';
import { useRelances } from '@/hooks/useRelances';
import { relanceService } from '@/services/relanceService';
import { detteFiscaleService } from '@/services/detteFiscaleService';
import { configurationService } from '@/services/configurationService';
import { extraireMessageErreur } from '@/services/apiClient';
import type { DetteFiscale } from '@/types/detteFiscale.types';
import type { CanalNotification, RelanceApercu } from '@/types/relance.types';
import { formaterDateFr, formaterMontant } from '@/utils/formatDate';

function getInitiales(nom: string): string {
  if (!nom) return 'CF';
  const parts = nom.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function RelancesPage() {
  const [dettes, setDettes] = useState<DetteFiscale[]>([]);
  const [chargementDonnees, setChargementDonnees] = useState(false);

  // Onglet principal : 'envoi' | 'file_prioritaire' | 'journal'
  const [ongletPrincipal, setOngletPrincipal] = useState<'envoi' | 'file_prioritaire' | 'journal'>('envoi');

  // Sélection de la créance active
  const [detteFiscaleId, setDetteFiscaleId] = useState<number | ''>('');
  const [detteRecherchee, setDetteRecherchee] = useState<number | null>(null);
  const [rechercheTexte, setRechercheTexte] = useState('');

  // Filtres de la file prioritaire
  const [filtreRetard, setFiltreRetard] = useState<string>('TOUS');
  const [filtreImpot, setFiltreImpot] = useState<string>('TOUS');
  const [modeVueFile, setModeVueFile] = useState<'table' | 'cartes'>('table');
  const [pageCourante, setPageCourante] = useState(1);
  const [elementsParPage, setElementsParPage] = useState(15);

  // Configuration de l'envoi — Email uniquement (canal SMS retiré)
  const canalChoisi: CanalNotification = 'EMAIL';
  const ongletApercu = 'EMAIL';

  // Libellé de l'Expéditeur officiel et ville d'émission dynamiques
  const [libelleExpediteur, setLibelleExpediteur] = useState<string>(() =>
    configurationService.getLibelleExpediteurActuel()
  );
  const [villeEmission, setVilleEmission] = useState<string>(() =>
    configurationService.getVilleEmissionActuelle()
  );

  useEffect(() => {
    configurationService.getConfiguration().then((cfg) => {
      if (cfg.smtpExpediteurNom) setLibelleExpediteur(cfg.smtpExpediteurNom);
      if (cfg.villeEmission) setVilleEmission(cfg.villeEmission);
    }).catch(() => {});
  }, []);

  // Aperçu dynamique et édition
  const [apercu, setApercu] = useState<RelanceApercu | null>(null);
  const [chargementApercu, setChargementApercu] = useState(false);
  const [objetEmail, setObjetEmail] = useState('');
  const [messageEmail, setMessageEmail] = useState('');

  // États d'envoi et feedback
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);

  const { relances, chargement: chargementRelances, recharger } = useRelances(detteRecherchee);

  const chargerDettes = useCallback(async () => {
    setChargementDonnees(true);
    setErreur(null);
    try {
      const dettesData = await detteFiscaleService.listerToutes();
      const dettesTriees = [...dettesData].sort((a, b) => (b.soldeRestant ?? 0) - (a.soldeRestant ?? 0));
      setDettes(dettesTriees);

      if (dettesTriees.length > 0 && detteFiscaleId === '') {
        const premiereDetteAvecSolde = dettesTriees.find((d) => d.soldeRestant > 0) || dettesTriees[0];
        setDetteFiscaleId(premiereDetteAvecSolde.id);
        setDetteRecherchee(premiereDetteAvecSolde.id);
      }
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setChargementDonnees(false);
    }
  }, [detteFiscaleId]);

  useEffect(() => {
    void chargerDettes();
  }, [chargerDettes]);

  // Charger l'aperçu dynamique dès qu'une dette est ciblée
  useEffect(() => {
    if (!detteRecherchee) {
      setApercu(null);
      return;
    }
    let ignore = false;
    setChargementApercu(true);

    relanceService
      .obtenirApercu(detteRecherchee)
      .then((data) => {
        if (!ignore) {
          setApercu(data);
          setObjetEmail(data.objetEmail);
          setMessageEmail(data.corpsEmail);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error('Erreur chargement aperçu relance:', err);
        }
      })
      .finally(() => {
        if (!ignore) setChargementApercu(false);
      });

    return () => {
      ignore = true;
    };
  }, [detteRecherchee]);

  const detteSelectionnee = useMemo(() => {
    return dettes.find((d) => d.id === detteRecherchee);
  }, [dettes, detteRecherchee]);

  // Calcul des statistiques globales pour les 4 KPIs
  const kpis = useMemo(() => {
    const creancesImpayees = dettes.filter((d) => d.soldeRestant > 0);
    const totalImpayes = creancesImpayees.reduce((acc, d) => acc + (d.soldeRestant ?? 0), 0);
    const relancesEnvoyees = dettes.reduce((acc, d) => acc + (d.nombreRelancesEnvoyees ?? 0), 0);
    const dossiersAvecRelance = creancesImpayees.filter((d) => (d.nombreRelancesEnvoyees ?? 0) > 0).length;
    const tauxPression = creancesImpayees.length > 0 ? (dossiersAvecRelance / creancesImpayees.length) * 100 : 0;

    return {
      nbCreances: creancesImpayees.length,
      totalImpayes,
      relancesEnvoyees,
      tauxPression: Math.round(tauxPression),
    };
  }, [dettes]);

  // Liste des impôts uniques pour le filtre
  const listeImpots = useMemo(() => {
    const set = new Set<string>();
    dettes.forEach((d) => {
      if (d.impot) set.add(d.impot);
    });
    return Array.from(set).sort();
  }, [dettes]);

  // Créances filtrées pour la file prioritaire
  const creancesPrioritaires = useMemo(() => {
    return dettes.filter((d) => {
      if (d.soldeRestant <= 0) return false;

      // Filtre impôt
      if (filtreImpot !== 'TOUS' && d.impot !== filtreImpot) return false;

      // Filtre retard
      if (filtreRetard === 'MOINS_30' && d.joursDeRetard >= 30) return false;
      if (filtreRetard === 'ENTRE_30_90' && (d.joursDeRetard < 30 || d.joursDeRetard > 90)) return false;
      if (filtreRetard === 'PLUS_90' && d.joursDeRetard <= 90) return false;

      // Recherche textuelle
      if (rechercheTexte.trim()) {
        const q = rechercheTexte.toLowerCase();
        return (
          d.nomContribuable.toLowerCase().includes(q) ||
          d.impot.toLowerCase().includes(q) ||
          d.periodeFiscale.toLowerCase().includes(q) ||
          d.id.toString().includes(q)
        );
      }

      return true;
    });
  }, [dettes, filtreImpot, filtreRetard, rechercheTexte]);

  // Pagination de la file prioritaire
  const totalPages = Math.max(1, Math.ceil(creancesPrioritaires.length / elementsParPage));
  const creancesPaginees = useMemo(() => {
    const start = (pageCourante - 1) * elementsParPage;
    return creancesPrioritaires.slice(start, start + elementsParPage);
  }, [creancesPrioritaires, pageCourante, elementsParPage]);

  function changerDette(idStr: string) {
    if (idStr === '') {
      setDetteFiscaleId('');
      setDetteRecherchee(null);
    } else {
      const idNum = Number(idStr);
      setDetteFiscaleId(idNum);
      setDetteRecherchee(idNum);
      setSucces(null);
      setErreur(null);
    }
  }

  function selectionnerPourRelance(id: number) {
    setDetteFiscaleId(id);
    setDetteRecherchee(id);
    setOngletPrincipal('envoi');
    setSucces(null);
    setErreur(null);
    window.scrollTo({ top: 320, behavior: 'smooth' });
  }

  function reinitialiserMessages() {
    if (apercu) {
      setObjetEmail(apercu.objetEmail);
      setMessageEmail(apercu.corpsEmail);
    }
  }

  async function gererEnvoiRelance(e: FormEvent) {
    e.preventDefault();
    if (!detteRecherchee) {
      setErreur('Veuillez sélectionner une créance fiscale valide.');
      return;
    }

    setErreur(null);
    setSucces(null);
    setEnvoiEnCours(true);

    try {
      await relanceService.envoyerManuelle({
        detteFiscaleId: detteRecherchee,
        canal: canalChoisi,
        messageEmail: messageEmail.trim() || undefined,
        objetEmail: objetEmail.trim() || undefined,
      });

      setSucces(`Notification de relance transmise avec succès par Courrier Électronique au contribuable.`);
      await Promise.all([recharger(), chargerDettes()]);
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setEnvoiEnCours(false);
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
              <span>DIRECTION REGIONALE DES IMPOTS - VATOVAVY FITOVINANY · RECOUVREMENT & SOMMATIONS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>📨</span> Relances Fiscales & Suivi des Notifications
            </h1>
            <p className="text-xs sm:text-sm text-red-100 max-w-2xl font-light leading-relaxed">
              Dispositif officiel d'émission automatisée de rappels amiables, mises en demeure et avis d'exécution par courrier électronique officiel avec avis certifié conforme au CGI Madagascar.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 self-start md:self-auto">
            <div className="flex items-center gap-2 rounded-lg bg-black/25 px-3 py-2 text-xs border border-white/10 font-mono text-amber-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Canal Email ✓ Opérationnel</span>
            </div>
            <Button
              variante="secondaire"
              onClick={() => void chargerDettes()}
              enCours={chargementDonnees}
              className="!bg-white/15 !text-white !border-white/20 hover:!bg-white/25 text-xs shadow-sm"
            >
              🔄 Actualiser
            </Button>
          </div>
        </div>
      </div>


      {/* 2. Cartes KPIs Stratégiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 : Créances en souffrance */}
        <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Créances Ciblées</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-700 text-lg">
              🎯
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-gray-900">{kpis.nbCreances}</span>
            <span className="text-xs text-gray-500 font-medium">dossiers avec solde</span>
          </div>
          <div className="mt-2 text-[11px] text-gray-500 flex items-center gap-1">
            <span className="font-semibold text-red-700">Recouvrement actif</span> · Priorité impayés
          </div>
        </div>

        {/* KPI 2 : Total Relances Expédiées */}
        <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Relances Notifiées</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 text-lg">
              📬
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-gray-900">{kpis.relancesEnvoyees}</span>
            <span className="text-xs text-gray-500 font-medium">avis envoyés</span>
          </div>
          <div className="mt-2 text-[11px] text-gray-500 flex items-center gap-1">
            <span className="font-semibold text-emerald-700">Courrier Électronique</span> délivré
          </div>
        </div>

        {/* KPI 3 : Masse financière impayée */}
        <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Masse en Relance</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700 text-lg">
              💰
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-extrabold text-fiscal-bordeaux font-mono">
              {formaterMontant(kpis.totalImpayes)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-gray-500 flex items-center gap-1">
            <span className="font-semibold text-amber-700">Créances exigibles</span> à recouvrer
          </div>
        </div>

        {/* KPI 4 : Taux de couverture de relance */}
        <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Pression Fiscale</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700 text-lg">
              📈
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-gray-900">{kpis.tauxPression}%</span>
            <span className="text-xs text-gray-500 font-medium">couverture des dossiers</span>
          </div>
          <div className="mt-2 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                kpis.tauxPression >= 75 ? 'bg-emerald-600' : kpis.tauxPression >= 40 ? 'bg-amber-500' : 'bg-red-600'
              }`}
              style={{ width: `${Math.min(kpis.tauxPression, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Navigation par Onglets Principaux */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-1">
        <div className="flex gap-2 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setOngletPrincipal('envoi')}
            className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all ${
              ongletPrincipal === 'envoi'
                ? 'bg-fiscal-bordeaux text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <span>⚡</span>
            <span>Studio d'Envoi Multicanal</span>
            {detteSelectionnee && (
              <span className="ml-1 text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
                #{detteSelectionnee.id}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setOngletPrincipal('file_prioritaire')}
            className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all ${
              ongletPrincipal === 'file_prioritaire'
                ? 'bg-fiscal-bordeaux text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <span>📋</span>
            <span>File des Créances Prioritaires</span>
            <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold">
              {creancesPrioritaires.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setOngletPrincipal('journal')}
            className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all ${
              ongletPrincipal === 'journal'
                ? 'bg-fiscal-bordeaux text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <span>📜</span>
            <span>Journal & Historique ({relances.length})</span>
          </button>
        </div>
      </div>

      {/* 4. CONTENU DE L'ONGLET 1 : ASSISTANT D'ENVOI & STUDIO MULTICANAL */}
      {ongletPrincipal === 'envoi' && (
        <div className="space-y-6">
          {/* Sélection de la créance */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <span>🎯</span> Sélectionner la créance fiscale à notifier :
                </label>
                <p className="text-xs text-gray-500">
                  Choisissez parmi les créances ayant un solde impayé pour générer automatiquement l'avis adapté.
                </p>
              </div>
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Rechercher nom, NIF, ID..."
                  value={rechercheTexte}
                  onChange={(e) => setRechercheTexte(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-fiscal-bordeaux focus:ring-1 focus:ring-fiscal-bordeaux"
                />
              </div>
            </div>

            <select
              value={detteFiscaleId}
              onChange={(e) => changerDette(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm bg-white focus:border-fiscal-bordeaux focus:ring-1 focus:ring-fiscal-bordeaux shadow-sm"
            >
              <option value="">-- Choisir une créance fiscale parmi la liste --</option>
              {dettes
                .filter((d) => {
                  if (!rechercheTexte.trim()) return true;
                  const q = rechercheTexte.toLowerCase();
                  return (
                    d.nomContribuable.toLowerCase().includes(q) ||
                    d.impot.toLowerCase().includes(q) ||
                    d.periodeFiscale.toLowerCase().includes(q) ||
                    d.id.toString().includes(q)
                  );
                })
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    [#{d.id}] {d.nomContribuable} — {d.impot} ({d.periodeFiscale}) — Solde : {d.soldeRestant.toLocaleString('fr-FR')} Ar ({d.statut} · {d.nombreRelancesEnvoyees} relances)
                  </option>
                ))}
            </select>
          </div>

          {/* Fiche récapitulative de la créance sélectionnée */}
          {detteSelectionnee && (
            <div className="rounded-xl border border-red-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-red-50 via-amber-50/40 to-white px-5 py-3.5 border-b border-red-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-fiscal-bordeaux text-white font-bold text-sm shadow-sm">
                    {getInitiales(detteSelectionnee.nomContribuable)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-red-900 uppercase tracking-wider font-mono">
                        Dossier N° {detteSelectionnee.id}
                      </span>
                      {apercu?.nif && (
                        <span className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-[11px] font-mono font-medium text-gray-700">
                          NIF : {apercu.nif}
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-extrabold text-gray-900 leading-tight">
                      {detteSelectionnee.nomContribuable}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <StatutDetteBadge statut={detteSelectionnee.statut} />
                  {detteSelectionnee.niveauRisque && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        detteSelectionnee.niveauRisque === 'RISQUE_ELEVE'
                          ? 'bg-red-100 text-red-800'
                          : detteSelectionnee.niveauRisque === 'RISQUE_MOYEN'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      <span>⚡</span>
                      <span>{detteSelectionnee.niveauRisque.replace('RISQUE_', 'Risque ')}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Chiffres & Détails financiers */}
              <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-gray-500 block font-medium">Type d'Impôt :</span>
                  <span className="font-bold text-gray-900 text-sm">{detteSelectionnee.impot}</span>
                  <span className="text-gray-400 block text-[11px]">Code : {apercu?.impotCode || '-'}</span>
                </div>

                <div>
                  <span className="text-gray-500 block font-medium">Période d'imposition :</span>
                  <span className="font-bold text-gray-900 text-sm">{detteSelectionnee.periodeFiscale}</span>
                  <span className="text-gray-400 block text-[11px]">
                    Échéance : {detteSelectionnee.dateEcheance ? formaterDateFr(detteSelectionnee.dateEcheance) : '-'}
                  </span>
                </div>

                <div>
                  <span className="text-gray-500 block font-medium">Montant Liquidé / Déjà Payé :</span>
                  <span className="font-semibold text-gray-800 text-sm font-mono">
                    {formaterMontant(detteSelectionnee.montantDu)}
                  </span>
                  <span className="text-emerald-700 block text-[11px] font-mono">
                    Payé : {formaterMontant(detteSelectionnee.montantPaye)}
                  </span>
                </div>

                <div className="rounded-xl bg-red-50 border border-red-200 p-3">
                  <span className="text-red-700 font-bold block text-[11px] uppercase tracking-wide">
                    ⚠️ Solde Exigible :
                  </span>
                  <span className="font-black text-fiscal-bordeaux text-base sm:text-lg font-mono">
                    {formaterMontant(detteSelectionnee.soldeRestant)}
                  </span>
                  {detteSelectionnee.joursDeRetard > 0 && (
                    <span className="text-red-600 block text-[11px] font-semibold mt-0.5">
                      ⏳ {detteSelectionnee.joursDeRetard} jours de retard
                    </span>
                  )}
                </div>
              </div>

              {/* Barre des coordonnées de contact */}
              {apercu && (
                <div className="bg-gray-50/80 px-5 py-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <span className="font-semibold text-gray-700">📧 Courriel Officiel :</span>
                      {apercu.email ? (
                        <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 font-bold text-blue-800 border border-blue-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          {apercu.email}
                        </span>
                      ) : (
                        <span className="rounded bg-red-50 px-2 py-0.5 font-semibold text-red-600 italic">
                          Non renseigné
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="text-[11px] text-gray-500">
                    Historique :{' '}
                    <strong className="text-gray-900 font-mono">
                      {detteSelectionnee.nombreRelancesEnvoyees} relances passées
                    </strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Formulaire d'envoi & Prévisualisation Interactive */}
          {detteRecherchee && (
            <form
              onSubmit={gererEnvoiRelance}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-4">
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                    <span>⚡</span> Studio de Notification Multicanal
                  </h2>
                  <p className="text-xs text-gray-500">
                    Les montants, motifs de retard et pénalités légales sont calculés en temps réel et injectés dans les messages.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={reinitialiserMessages}
                  className="inline-flex items-center gap-1.5 text-xs text-fiscal-bordeaux hover:underline font-semibold self-start sm:self-auto"
                >
                  <span>↺</span>
                  <span>Rétablir les messages réglementaires par défaut</span>
                </button>
              </div>

              {/* Canal de diffusion — Email uniquement (opérationnel) */}
              <div className="flex items-center gap-3 p-3.5 rounded-xl border-2 border-emerald-400 bg-emerald-50/60 shadow-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 text-lg shrink-0">📧</span>
                <div>
                  <div className="text-sm font-extrabold text-gray-900 flex items-center gap-2 flex-wrap">
                    Courrier Électronique Officiel
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                      ✓ Canal unique · 100% Opérationnel
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    Avis d'imposition officiel complet avec décomposition des sommes et pièce jointe PDF.
                  </div>
                </div>
              </div>

              {/* Aperçu du Courrier Électronique Officiel */}
              <div className="space-y-4">
                {chargementApercu ? (
                  <div className="p-12 text-center text-xs text-gray-400">
                    <span className="inline-block animate-spin text-2xl mb-2">⏳</span>
                    <p>Génération de l'aperçu certifié DRI en cours...</p>
                  </div>
                ) : (
                  <div>
                    {/* APERÇU MODE EMAIL : PAPIER À LETTRES OFFICIEL DRI */}
                    {ongletApercu === 'EMAIL' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Objet du Courrier Électronique :
                          </label>
                          <input
                            type="text"
                            value={objetEmail}
                            onChange={(e) => setObjetEmail(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-xs font-bold text-gray-900 focus:border-fiscal-bordeaux focus:ring-1 focus:ring-fiscal-bordeaux"
                          />
                        </div>

                        {/* Maquette papier à lettres DGI */}
                        <div className="rounded-xl border border-gray-300 bg-white p-6 shadow-sm font-sans space-y-4">
                          {/* Cartouche d'en-tête républicain */}
                          <div className="border-b-2 border-fiscal-bordeaux pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                            <div className="space-y-0.5">
                              <div className="font-extrabold text-fiscal-bordeaux tracking-wider uppercase text-[11px]">
                                REPOBLIKAN'I MADAGASIKARA
                              </div>
                              <div className="text-[10px] text-gray-500 italic">
                                Fitiavana - Tanindrazana - Fandrosoana
                              </div>
                              <div className="font-bold text-gray-800 text-[11px] pt-1">
                                MINISTÈRE DE L'ÉCONOMIE ET DES FINANCES
                              </div>
                              <div className="font-extrabold text-gray-900 text-xs">
                                {libelleExpediteur.toUpperCase()}
                              </div>
                            </div>

                            <div className="text-right sm:text-right text-[11px] text-gray-600 font-mono space-y-0.5">
                              <div>Réf : REL-DGI-{detteSelectionnee?.id}-2026</div>
                              <div>{villeEmission}, le {new Date().toLocaleDateString('fr-FR')}</div>
                              <div className="text-fiscal-bordeaux font-bold">AVIS DE MISE EN RECOUVREMENT</div>
                            </div>
                          </div>

                          {/* Zone d'édition du corps de l'email */}
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              Corps du message officiel certifié :
                            </label>
                            <textarea
                              value={messageEmail}
                              onChange={(e) => setMessageEmail(e.target.value)}
                              rows={11}
                              className="w-full rounded-lg border border-gray-300 p-3 font-mono text-xs leading-relaxed text-gray-800 bg-gray-50/50 focus:bg-white focus:border-fiscal-bordeaux focus:ring-1 focus:ring-fiscal-bordeaux"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bannières de Feedback Succès & Erreur */}
              {erreur && (
                <div className="rounded-xl bg-red-50 p-4 text-xs text-red-800 border border-red-200 flex items-start gap-2.5">
                  <span className="text-base">⚠️</span>
                  <div>
                    <span className="font-bold block">Erreur lors de la notification :</span>
                    <span>{erreur}</span>
                  </div>
                </div>
              )}

              {succes && (
                <div className="rounded-xl bg-green-50 p-4 text-xs text-green-900 border border-green-200 flex items-start gap-2.5">
                  <span className="text-base">✅</span>
                  <div>
                    <span className="font-bold block">Transmission effectuée :</span>
                    <span>{succes}</span>
                  </div>
                </div>
              )}

              {/* Bouton d'action principal */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  Avis légalement opposable conformément aux dispositions du Code Général des Impôts.
                </div>

                <Button
                  type="submit"
                  enCours={envoiEnCours}
                  className="w-full sm:w-auto px-7 py-3 text-sm font-extrabold shadow-md !bg-fiscal-bordeaux hover:!bg-[#631818]"
                >
                  🚀 Déclencher l'envoi de la relance (Courrier Électronique)
                </Button>
              </div>
            </form>
          )}

          {/* Chronologie des relances pour cette créance */}
          {detteRecherchee && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <span>📜</span> Historique des Relances pour ce Dossier
                </h3>
                <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-bold">
                  {relances.length} expédition(s)
                </span>
              </div>

              {chargementRelances ? (
                <div className="text-center py-8 text-xs text-gray-400">
                  <span className="inline-block animate-spin text-xl mb-1">⏳</span>
                  <p>Chargement de la chronologie des avis...</p>
                </div>
              ) : (
                <RelanceTimeline relances={relances} />
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. CONTENU DE L'ONGLET 2 : FILE DES CRÉANCES PRIORITAIRES */}
      {ongletPrincipal === 'file_prioritaire' && (
        <div className="space-y-4">
          {/* Barre d'outils et de filtrage */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <input
                type="text"
                placeholder="Filtrer par nom, NIF..."
                value={rechercheTexte}
                onChange={(e) => {
                  setRechercheTexte(e.target.value);
                  setPageCourante(1);
                }}
                className="w-full sm:w-56 rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-fiscal-bordeaux focus:ring-1 focus:ring-fiscal-bordeaux"
              />

              {/* Filtre type d'impôt */}
              <select
                value={filtreImpot}
                onChange={(e) => {
                  setFiltreImpot(e.target.value);
                  setPageCourante(1);
                }}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs bg-white focus:border-fiscal-bordeaux focus:ring-1 focus:ring-fiscal-bordeaux"
              >
                <option value="TOUS">Tous impôts</option>
                {listeImpots.map((imp) => (
                  <option key={imp} value={imp}>
                    {imp}
                  </option>
                ))}
              </select>

              {/* Filtre gravité retard */}
              <select
                value={filtreRetard}
                onChange={(e) => {
                  setFiltreRetard(e.target.value);
                  setPageCourante(1);
                }}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs bg-white focus:border-fiscal-bordeaux focus:ring-1 focus:ring-fiscal-bordeaux"
              >
                <option value="TOUS">Tout niveau de retard</option>
                <option value="MOINS_30">&lt; 30 jours (Retard initial)</option>
                <option value="ENTRE_30_90">30 à 90 jours (Sommation requise)</option>
                <option value="PLUS_90">&gt; 90 jours (Critique / ATD)</option>
              </select>
            </div>

            {/* Basculeur Table / Cartes */}
            <div className="flex items-center gap-1.5 self-end md:self-auto">
              <button
                type="button"
                onClick={() => setModeVueFile('table')}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  modeVueFile === 'table'
                    ? 'bg-fiscal-bordeaux text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="Affichage Tableau"
              >
                <span>📊</span>
                <span className="hidden sm:inline">Tableau</span>
              </button>
              <button
                type="button"
                onClick={() => setModeVueFile('cartes')}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  modeVueFile === 'cartes'
                    ? 'bg-fiscal-bordeaux text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="Affichage Cartes"
              >
                <span>🗂️</span>
                <span className="hidden sm:inline">Cartes</span>
              </button>
            </div>
          </div>

          {/* Affichage de la file de créances */}
          {creancesPrioritaires.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
              <span className="text-4xl block mb-2">🎉</span>
              <h3 className="text-base font-bold text-gray-900">Aucune créance en retard selon ces critères</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Toutes les dettes répondant aux filtres sélectionnés sont soldées ou régularisées.
              </p>
            </div>
          ) : modeVueFile === 'table' ? (
            /* MODE TABLE DESKTOP */
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100/80 border-b border-gray-200 text-gray-600 font-extrabold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Contribuable & NIF</th>
                      <th className="py-3 px-3">Créance & Période</th>
                      <th className="py-3 px-3">Retard</th>
                      <th className="py-3 px-3 text-right">Solde Dû (Ar)</th>
                      <th className="py-3 px-3 text-center">Relances Déjà Reçues</th>
                      <th className="py-3 px-3 text-center">Statut Actuel</th>
                      <th className="py-3 px-4 text-right">Action Immédiate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-sans">
                    {creancesPaginees.map((dette) => {
                      const estCritique = dette.joursDeRetard > 90;
                      const estMoyen = dette.joursDeRetard >= 30 && dette.joursDeRetard <= 90;

                      return (
                        <tr
                          key={dette.id}
                          className="hover:bg-red-50/20 transition-colors group cursor-pointer"
                          onClick={() => selectionnerPourRelance(dette.id)}
                        >
                          {/* Contribuable */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-900 font-extrabold text-xs shrink-0">
                                {getInitiales(dette.nomContribuable)}
                              </div>
                              <div className="min-w-0">
                                <span className="font-extrabold text-gray-900 hover:text-fiscal-bordeaux block truncate">
                                  {dette.nomContribuable}
                                </span>
                                <span className="text-[11px] text-gray-400 font-mono">Dossier #{dette.id}</span>
                              </div>
                            </div>
                          </td>

                          {/* Créance & Période */}
                          <td className="py-3 px-3">
                            <div className="font-bold text-gray-800">{dette.impot}</div>
                            <div className="text-[11px] text-gray-500 font-mono">{dette.periodeFiscale}</div>
                          </td>

                          {/* Retard */}
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                estCritique
                                  ? 'bg-red-100 text-red-800'
                                  : estMoyen
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              <span>⏳</span>
                              <span>{dette.joursDeRetard} j</span>
                            </span>
                          </td>

                          {/* Solde restant */}
                          <td className="py-3 px-3 text-right font-mono font-black text-fiscal-bordeaux text-xs">
                            {formaterMontant(dette.soldeRestant)}
                          </td>

                          {/* Relances Déjà Reçues */}
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold font-mono ${
                                dette.nombreRelancesEnvoyees > 0
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {dette.nombreRelancesEnvoyees}
                            </span>
                          </td>

                          {/* Statut actuel */}
                          <td className="py-3 px-3 text-center">
                            <StatutDetteBadge statut={dette.statut} />
                          </td>

                          {/* Action */}
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                selectionnerPourRelance(dette.id);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-fiscal-bordeaux px-3 py-1.5 text-xs font-extrabold text-white shadow-sm hover:bg-[#601414] transition-colors"
                            >
                              <span>⚡</span>
                              <span>Relancer</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* MODE CARTES MOBILE/TABLETTE */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {creancesPaginees.map((dette) => {
                const estCritique = dette.joursDeRetard > 90;
                return (
                  <div
                    key={dette.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-900 font-extrabold text-xs">
                            {getInitiales(dette.nomContribuable)}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-gray-900 text-xs">{dette.nomContribuable}</h4>
                            <span className="text-[10px] text-gray-400 font-mono">Dossier #{dette.id}</span>
                          </div>
                        </div>
                        <StatutDetteBadge statut={dette.statut} />
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400 block text-[10px]">Impôt & Période :</span>
                          <span className="font-bold text-gray-800">
                            {dette.impot} ({dette.periodeFiscale})
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px]">Retard constaté :</span>
                          <span
                            className={`font-bold inline-flex items-center gap-1 ${
                              estCritique ? 'text-red-700' : 'text-amber-700'
                            }`}
                          >
                            ⏳ {dette.joursDeRetard} jours
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 rounded-lg bg-red-50/70 border border-red-100 p-2.5 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-red-800">SOLDE RESTANT :</span>
                        <span className="font-black text-fiscal-bordeaux font-mono text-sm">
                          {formaterMontant(dette.soldeRestant)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-gray-500">
                        Relances : <strong>{dette.nombreRelancesEnvoyees}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => selectionnerPourRelance(dette.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-fiscal-bordeaux px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#601414]"
                      >
                        <span>⚡</span>
                        <span>Relancer ce dossier</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {creancesPrioritaires.length > elementsParPage && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span>Afficher</span>
                <select
                  value={elementsParPage}
                  onChange={(e) => {
                    setElementsParPage(Number(e.target.value));
                    setPageCourante(1);
                  }}
                  className="rounded border border-gray-300 px-2 py-1 text-xs bg-white"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>dossiers par page · Total : {creancesPrioritaires.length}</span>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variante="secondaire"
                  onClick={() => setPageCourante((p) => Math.max(1, p - 1))}
                  disabled={pageCourante === 1}
                  className="text-xs !py-1 !px-2.5"
                >
                  ← Précédent
                </Button>
                <span className="px-3 py-1 font-semibold text-gray-800">
                  Page {pageCourante} sur {totalPages}
                </span>
                <Button
                  variante="secondaire"
                  onClick={() => setPageCourante((p) => Math.min(totalPages, p + 1))}
                  disabled={pageCourante === totalPages}
                  className="text-xs !py-1 !px-2.5"
                >
                  Suivant →
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. CONTENU DE L'ONGLET 3 : JOURNAL & AUDIT DES NOTIFICATIONS */}
      {ongletPrincipal === 'journal' && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <span>📜</span> Journal d'Audit & Procédure de Relance
              </h3>
              <p className="text-xs text-gray-500">
                Suivi chronologique des notifications expédiées pour la créance actuellement inspectée (Dossier #{detteSelectionnee?.id || '—'}).
              </p>
            </div>

            {detteSelectionnee && (
              <div className="text-xs text-gray-600 font-mono">
                Contribuable : <strong className="text-gray-900">{detteSelectionnee.nomContribuable}</strong>
              </div>
            )}
          </div>

          {/* Timeline */}
          {chargementRelances ? (
            <div className="text-center py-12 text-xs text-gray-400">
              <span className="inline-block animate-spin text-2xl mb-2">⏳</span>
              <p>Chargement du registre chronologique des relances...</p>
            </div>
          ) : (
            <RelanceTimeline relances={relances} />
          )}

          {/* Encadré d'information juridique CGI Madagascar */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-700 space-y-2">
            <div className="font-extrabold text-slate-900 flex items-center gap-2">
              <span>⚖️</span> Rappel des Procédures selon le Code Général des Impôts :
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed text-slate-600">
              <li>
                <strong>Niveau 1 (Amiable) :</strong> Notification préalable invitant le contribuable à régulariser sous huitaine.
              </li>
              <li>
                <strong>Niveau 2 (Mise en Demeure) :</strong> Sommation formelle avec décompte des intérêts et pénalités de retard.
              </li>
              <li>
                <strong>Niveau 3 & 4 (Titre de Recouvrement Forcé) :</strong> Émission de l'Avis à Tiers Détenteur (ATD) ou fermeture d'établissement en cas de persistance du défaut de paiement.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}