import { useEffect, useState, useMemo, useCallback, type FormEvent } from 'react';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { StatutDetteBadge } from '@/components/metier/StatutDetteBadge';
import { detteFiscaleService } from '@/services/detteFiscaleService';
import { paiementService } from '@/services/paiementService';
import { moratoireService } from '@/services/moratoireService';
import { rapportService } from '@/services/rapportService';
import { extraireMessageErreur } from '@/services/apiClient';
import { formaterDateFr, formaterDateHeureFr, formaterMontant } from '@/utils/formatDate';
import type { DetteFiscale } from '@/types/detteFiscale.types';
import type { ModePaiement, Paiement } from '@/types/paiement.types';
import type { MoratoireDTO, EcheanceMoratoireDTO } from '@/types/moratoire.types';

const MODES_PAIEMENT: ModePaiement[] = ['ESPECES', 'VIREMENT', 'MOBILE_MONEY', 'CHEQUE'];

interface PaiementsPageProps {
  ongletInitial?: 'ENCAISSEMENT' | 'REGISTRE' | 'MORATOIRES';
  modaliteInitiale?: 'INDIVIDUEL' | 'GROUPE' | 'MORATOIRE';
}

export function PaiementsPage({
  ongletInitial = 'ENCAISSEMENT',
  modaliteInitiale = 'INDIVIDUEL',
}: PaiementsPageProps) {
  // Navigation par onglets majeurs
  const [ongletActif, setOngletActif] = useState<'ENCAISSEMENT' | 'REGISTRE' | 'MORATOIRES'>(ongletInitial);

  // Modalité de versement choisie
  const [modaliteReglement, setModaliteReglement] = useState<'INDIVIDUEL' | 'GROUPE' | 'MORATOIRE'>(modaliteInitiale);

  // Données
  const [dettes, setDettes] = useState<DetteFiscale[]>([]);
  const [chargementDettes, setChargementDettes] = useState(false);
  const [rechercheContribuable, setRechercheContribuable] = useState('');
  const [afficherToutesDettes, setAfficherToutesDettes] = useState(false);

  // Registre des paiements & quittances
  const [paiementsHistorique, setPaiementsHistorique] = useState<Paiement[]>([]);
  const [chargementHistorique, setChargementHistorique] = useState(false);
  const [rechercheRegistre, setRechercheRegistre] = useState('');
  const [pageRegistre, setPageRegistre] = useState(1);
  const [elementsParPageRegistre, setElementsParPageRegistre] = useState(15);
  const [telechargementEnCoursId, setTelechargementEnCoursId] = useState<number | null>(null);

  // Données Moratoires
  const [moratoires, setMoratoires] = useState<MoratoireDTO[]>([]);
  const [chargementMoratoires, setChargementMoratoires] = useState(false);
  const [rechercheMoratoire, setRechercheMoratoire] = useState('');
  const [moratoireDetail, setMoratoireDetail] = useState<MoratoireDTO | null>(null);
  const [telechargementConventionId, setTelechargementConventionId] = useState<number | null>(null);

  // --- FORMULAIRE PAIEMENT INDIVIDUEL ---
  const [detteSelectionneeId, setDetteSelectionneeId] = useState<number | ''>('');
  const [montant, setMontant] = useState<number | ''>('');
  const [dateEncaissement, setDateEncaissement] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [modePaiement, setModePaiement] = useState<ModePaiement>('ESPECES');
  const [reference, setReference] = useState('');

  // --- FORMULAIRE PAIEMENT GROUPÉ ---
  const [dettesSelectionneesIds, setDettesSelectionneesIds] = useState<number[]>([]);
  const [montantsParDette, setMontantsParDette] = useState<Record<number, number>>({});

  // --- FORMULAIRE MORATOIRE / ÉCHELONNEMENT ---
  const [detteMoratoireId, setDetteMoratoireId] = useState<number | ''>('');
  const [nombreEcheances, setNombreEcheances] = useState<number>(6);
  const [dateDebutMoratoire, setDateDebutMoratoire] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  });
  const [commentaireMoratoire, setCommentaireMoratoire] = useState('');
  const [moratoireCreeSucces, setMoratoireCreeSucces] = useState<MoratoireDTO | null>(null);

  // Modal paiement d'une mensualité de moratoire
  const [echeanceAPayer, setEcheanceAPayer] = useState<EcheanceMoratoireDTO | null>(null);
  const [montantEcheance, setMontantEcheance] = useState<number>(0);
  const [modePaiementEch, setModePaiementEch] = useState<ModePaiement>('ESPECES');
  const [referenceEch, setReferenceEch] = useState('');
  const [paiementEcheanceEnCours, setPaiementEcheanceEnCours] = useState(false);

  // Feedback utilisateur & Quittances récentes
  const [quittancesRecentes, setQuittancesRecentes] = useState<Paiement[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succesMsg, setSuccesMsg] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  // Chargement des données initiales
  const chargerDonnees = useCallback(async () => {
    setChargementDettes(true);
    setErreur(null);
    try {
      const [dettesData, paiementsData, moratoiresData] = await Promise.all([
        detteFiscaleService.listerToutes(),
        paiementService.listerTous(),
        moratoireService.listerTous(),
      ]);
      setDettes(dettesData);
      setPaiementsHistorique(paiementsData);
      setMoratoires(moratoiresData);
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setChargementDettes(false);
      setChargementHistorique(false);
      setChargementMoratoires(false);
    }
  }, []);

  useEffect(() => {
    void chargerDonnees();
  }, [chargerDonnees]);

  // Synchronisation avec les props
  useEffect(() => {
    if (ongletInitial) setOngletActif(ongletInitial);
    if (modaliteInitiale) setModaliteReglement(modaliteInitiale);
  }, [ongletInitial, modaliteInitiale]);

  // KPIs Stratégiques
  const kpis = useMemo(() => {
    const totalEncaisse = paiementsHistorique.reduce((acc, p) => acc + (p.montant ?? 0), 0);
    const totalQuittances = paiementsHistorique.length;
    const moratoiresActifs = moratoires.filter((m) => m.statut === 'ACTIF').length;
    const soldeSousMoratoire = moratoires
      .filter((m) => m.statut === 'ACTIF')
      .reduce((acc, m) => acc + (m.soldeRestantMoratoire ?? 0), 0);

    return { totalEncaisse, totalQuittances, moratoiresActifs, soldeSousMoratoire };
  }, [paiementsHistorique, moratoires]);

  // Filtrer les dettes selon recherche
  const dettesFiltrees = useMemo(() => {
    return dettes.filter((d) => {
      const correspondRecherche =
        rechercheContribuable.trim() === '' ||
        d.nomContribuable.toLowerCase().includes(rechercheContribuable.toLowerCase()) ||
        d.impot.toLowerCase().includes(rechercheContribuable.toLowerCase()) ||
        d.periodeFiscale.toLowerCase().includes(rechercheContribuable.toLowerCase()) ||
        String(d.id).includes(rechercheContribuable);

      if (!correspondRecherche) return false;
      if (afficherToutesDettes) return true;
      return d.soldeRestant > 0 && d.statut !== 'PAYE' && d.statut !== 'CLOTURE';
    });
  }, [dettes, rechercheContribuable, afficherToutesDettes]);

  const detteUniqueChoisie = useMemo(() => {
    return dettes.find((d) => d.id === detteSelectionneeId);
  }, [dettes, detteSelectionneeId]);

  const detteMoratoireChoisie = useMemo(() => {
    return dettes.find((d) => d.id === detteMoratoireId);
  }, [dettes, detteMoratoireId]);

  // Simulation d'échéancier moratoire en direct
  const echeancierSimule = useMemo(() => {
    if (!detteMoratoireChoisie || nombreEcheances < 2) return [];
    const solde = detteMoratoireChoisie.soldeRestant;
    const mensualite = Math.floor((solde / nombreEcheances) * 100) / 100;
    const liste = [];
    let cumul = 0;
    for (let i = 1; i <= nombreEcheances; i++) {
      const dt = new Date(dateDebutMoratoire);
      dt.setMonth(dt.getMonth() + (i - 1));
      const m = i < nombreEcheances ? mensualite : Math.round((solde - cumul) * 100) / 100;
      cumul += m;
      liste.push({
        numero: i,
        date: dt.toISOString().split('T')[0],
        montant: m,
      });
    }
    return liste;
  }, [detteMoratoireChoisie, nombreEcheances, dateDebutMoratoire]);

  // Gestion sélection multiple
  function toggleSelectionMultiple(dette: DetteFiscale) {
    setDettesSelectionneesIds((prev) => {
      const existe = prev.includes(dette.id);
      if (existe) {
        const nouv = prev.filter((id) => id !== dette.id);
        const copy = { ...montantsParDette };
        delete copy[dette.id];
        setMontantsParDette(copy);
        return nouv;
      } else {
        setMontantsParDette((prevM) => ({
          ...prevM,
          [dette.id]: dette.soldeRestant,
        }));
        return [...prev, dette.id];
      }
    });
  }

  function changerMontantDetteMultiple(detteId: number, val: number) {
    setMontantsParDette((prev) => ({
      ...prev,
      [detteId]: val,
    }));
  }

  const totalMontantMultiple = useMemo(() => {
    return dettesSelectionneesIds.reduce((acc, id) => acc + (montantsParDette[id] || 0), 0);
  }, [dettesSelectionneesIds, montantsParDette]);

  // Validation Paiement Individuel
  async function gererPaiementIndividuel(e: FormEvent) {
    e.preventDefault();
    if (!detteSelectionneeId || !montant || Number(montant) <= 0) return;

    setErreur(null);
    setSuccesMsg(null);
    setEnCours(true);
    try {
      const paiementCree = await paiementService.enregistrer({
        detteFiscaleId: Number(detteSelectionneeId),
        montant: Number(montant),
        modePaiement,
        reference: reference.trim() || undefined,
        datePaiement: dateEncaissement || undefined,
      });
      setSuccesMsg(`Paiement de ${formaterMontant(Number(montant))} enregistré avec succès.`);
      setDetteSelectionneeId('');
      setMontant('');
      setReference('');
      await chargerDonnees();
      if (paiementCree) {
        setQuittancesRecentes((prev) => [paiementCree, ...prev]);
      }
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setEnCours(false);
    }
  }

  // Validation Paiement Groupé
  async function gererPaiementGroupe(e: FormEvent) {
    e.preventDefault();
    if (dettesSelectionneesIds.length === 0 || totalMontantMultiple <= 0) return;

    setErreur(null);
    setSuccesMsg(null);
    setEnCours(true);
    try {
      const promises = dettesSelectionneesIds.map((id) =>
        paiementService.enregistrer({
          detteFiscaleId: id,
          montant: montantsParDette[id] || 0,
          modePaiement,
          reference: reference.trim() || undefined,
          datePaiement: dateEncaissement || undefined,
        })
      );
      const resultats = await Promise.all(promises);
      setSuccesMsg(`Paiement groupé de ${dettesSelectionneesIds.length} créance(s) enregistré (${formaterMontant(totalMontantMultiple)}).`);
      setDettesSelectionneesIds([]);
      setMontantsParDette({});
      setReference('');
      await chargerDonnees();
      if (resultats && resultats.length > 0) {
        setQuittancesRecentes((prev) => [...resultats, ...prev]);
      }
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setEnCours(false);
    }
  }

  // Validation Accord de Moratoire
  async function gererCreationMoratoire(e: FormEvent) {
    e.preventDefault();
    if (!detteMoratoireId) {
      setErreur('Veuillez sélectionner une créance fiscale à échelonner.');
      return;
    }
    if (nombreEcheances < 2) {
      setErreur('Un accord de moratoire doit comporter au moins 2 mensualités.');
      return;
    }

    setErreur(null);
    setSuccesMsg(null);
    setEnCours(true);
    try {
      const m = await moratoireService.creer({
        detteFiscaleId: Number(detteMoratoireId),
        nombreEcheances,
        dateDebut: dateDebutMoratoire,
        commentaire: commentaireMoratoire.trim() || undefined,
      });
      setMoratoireCreeSucces(m);
      setSuccesMsg(`Accord de moratoire N° ${m.reference || m.id} créé avec succès pour ${m.nomContribuable}.`);
      setDetteMoratoireId('');
      setCommentaireMoratoire('');
      await chargerDonnees();
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setEnCours(false);
    }
  }

  // Paiement d'une mensualité de moratoire
  async function payerEcheance() {
    if (!echeanceAPayer) return;
    setPaiementEcheanceEnCours(true);
    try {
      await moratoireService.payerEcheance(echeanceAPayer.id, {
        montant: montantEcheance,
        modePaiement: modePaiementEch,
        reference: referenceEch.trim() || undefined,
      });
      setEcheanceAPayer(null);
      await chargerDonnees();
      if (moratoireDetail) {
        const maj = await moratoireService.obtenirParId(moratoireDetail.id);
        setMoratoireDetail(maj);
      }
      setSuccesMsg(`Mensualité N° ${echeanceAPayer.numeroEcheance} réglée avec succès.`);
    } catch (err) {
      alert('Erreur règlement échéance : ' + extraireMessageErreur(err));
    } finally {
      setPaiementEcheanceEnCours(false);
    }
  }

  // Téléchargement Convention Moratoire PDF
  async function telechargerConventionPdf(id: number) {
    setTelechargementConventionId(id);
    try {
      await moratoireService.telechargerConventionPdf(id);
    } catch (err) {
      alert('Erreur téléchargement convention : ' + extraireMessageErreur(err));
    } finally {
      setTelechargementConventionId(null);
    }
  }

  // Téléchargement Quittance Paiement PDF
  async function telechargerQuittance(paiementId: number) {
    setTelechargementEnCoursId(paiementId);
    try {
      await paiementService.telechargerQuittancePdf(paiementId);
    } catch (err) {
      alert('Erreur téléchargement quittance : ' + extraireMessageErreur(err));
    } finally {
      setTelechargementEnCoursId(null);
    }
  }

  // Filtrage Registre des quittances
  const paiementsFiltres = useMemo(() => {
    return paiementsHistorique.filter((p) => {
      if (!rechercheRegistre.trim()) return true;
      const q = rechercheRegistre.toLowerCase();
      return (
        (p.numeroQuittance && p.numeroQuittance.toLowerCase().includes(q)) ||
        (p.nomContribuable && p.nomContribuable.toLowerCase().includes(q)) ||
        (p.nif && p.nif.toLowerCase().includes(q)) ||
        (p.reference && p.reference.toLowerCase().includes(q)) ||
        (p.modePaiement && p.modePaiement.toLowerCase().includes(q))
      );
    });
  }, [paiementsHistorique, rechercheRegistre]);

  const totalPagesRegistre = Math.max(1, Math.ceil(paiementsFiltres.length / elementsParPageRegistre));
  const paiementsPaginees = useMemo(() => {
    const start = (pageRegistre - 1) * elementsParPageRegistre;
    return paiementsFiltres.slice(start, start + elementsParPageRegistre);
  }, [paiementsFiltres, pageRegistre, elementsParPageRegistre]);

  // Filtrage Moratoires
  const moratoiresFiltres = useMemo(() => {
    return moratoires.filter((m) => {
      if (!rechercheMoratoire.trim()) return true;
      const q = rechercheMoratoire.toLowerCase();
      return (
        (m.reference && m.reference.toLowerCase().includes(q)) ||
        (m.nomContribuable && m.nomContribuable.toLowerCase().includes(q)) ||
        (m.nif && m.nif.toLowerCase().includes(q)) ||
        (m.impot && m.impot.toLowerCase().includes(q)) ||
        String(m.id).includes(q)
      );
    });
  }, [moratoires, rechercheMoratoire]);

  return (
    <div className="space-y-6">
      {/* 1. Bannière Institutionnelle DGI */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-fiscal-bordeaux via-[#601414] to-[#3a0a0a] p-6 text-white shadow-xl border border-red-900/40">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md border border-white/15">
              <span>🇲🇬</span>
              <span>DIRECTION REGIONALE DES IMPOTS - VATOVAVY FITOVINANY · GESTION DE CAISSE & ÉCHELONNEMENT</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>🏛️</span> Encaissements, Quittances & Moratoires
            </h1>
            <p className="text-xs sm:text-sm text-red-100 max-w-2xl font-light leading-relaxed">
              Enregistrement des versements au comptant, règlements groupés et conventions d’échelonnement (moratoires de 2 à 36 mensualités) avec émission instantanée des quittances et certificats DGI.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 self-start md:self-auto">
            <Button
              variante="secondaire"
              onClick={() => rapportService.telechargerGrandLivrePdf()}
              className="!bg-white/15 !text-white !border-white/20 hover:!bg-white/25 text-xs shadow-sm"
            >
              📄 Grand Livre PDF
            </Button>
            <Button
              variante="secondaire"
              onClick={() => void chargerDonnees()}
              enCours={chargementDettes || chargementHistorique || chargementMoratoires}
              className="!bg-white/15 !text-white !border-white/20 hover:!bg-white/25 text-xs shadow-sm"
            >
              🔄 Actualiser
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Cartes KPIs Stratégiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Recouvrement Réalisé</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 text-lg">
              💰
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-extrabold text-emerald-700 font-mono">
              {formaterMontant(kpis.totalEncaisse)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-gray-500 font-medium">
            Versements effectifs encaissés
          </div>
        </div>

        <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Quittances Délivrées</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700 text-lg">
              🧾
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-gray-900">{kpis.totalQuittances}</span>
            <span className="text-xs text-gray-500 font-medium">reçus certifiés</span>
          </div>
          <div className="mt-2 text-[11px] text-blue-700 font-medium">
            Avec QR Code & Cachet DGI
          </div>
        </div>

        <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Moratoires en Cours</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700 text-lg">
              📅
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-700">{kpis.moratoiresActifs}</span>
            <span className="text-xs text-gray-500 font-medium">plans actifs</span>
          </div>
          <div className="mt-2 text-[11px] text-gray-500 font-medium">
            Accords signés de paiement échelonné
          </div>
        </div>

        <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Masse sous Échéancier</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-700 text-lg">
              📊
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-extrabold text-fiscal-bordeaux font-mono">
              {formaterMontant(kpis.soldeSousMoratoire)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-gray-500 font-medium">
            Créances ventilées sur mensualités
          </div>
        </div>
      </div>

      {/* Bannières de Feedback */}
      {erreur && (
        <div className="rounded-xl bg-red-50 p-4 text-xs text-red-800 border border-red-200 flex items-start gap-2.5">
          <span className="text-base">⚠️</span>
          <div>
            <span className="font-bold block">Erreur :</span>
            <span>{erreur}</span>
          </div>
        </div>
      )}

      {succesMsg && (
        <div className="rounded-xl bg-green-50 p-4 text-xs text-green-900 border border-green-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-2.5">
            <span className="text-base">✅</span>
            <div>
              <span className="font-bold block">Opération enregistrée :</span>
              <span>{succesMsg}</span>
            </div>
          </div>
          {quittancesRecentes.length > 0 && (
            <Button
              onClick={() => void telechargerQuittance(quittancesRecentes[0].id)}
              enCours={telechargementEnCoursId === quittancesRecentes[0].id}
              className="text-xs !bg-emerald-700 hover:!bg-emerald-800 text-white shadow-sm shrink-0"
            >
              📄 Télécharger Quittance {quittancesRecentes[0].numeroQuittance || `#${quittancesRecentes[0].id}`}
            </Button>
          )}
        </div>
      )}

      {/* 3. Navigation par Onglets Principaux */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-1">
        <div className="flex gap-2 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setOngletActif('ENCAISSEMENT')}
            className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all ${
              ongletActif === 'ENCAISSEMENT'
                ? 'bg-fiscal-bordeaux text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <span>💳</span>
            <span>Guichet de Règlement & Modalités</span>
          </button>

          <button
            type="button"
            onClick={() => setOngletActif('REGISTRE')}
            className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all ${
              ongletActif === 'REGISTRE'
                ? 'bg-fiscal-bordeaux text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <span>🧾</span>
            <span>Registre des Quittances ({paiementsHistorique.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setOngletActif('MORATOIRES')}
            className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all ${
              ongletActif === 'MORATOIRES'
                ? 'bg-fiscal-bordeaux text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <span>📅</span>
            <span>Suivi des Moratoires & Échéanciers ({moratoires.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. CONTENU ONGLET 1 : GUICHET DE RÈGLEMENT & CHOIX DE MODALITÉS          */}
      {/* ========================================================================= */}
      {ongletActif === 'ENCAISSEMENT' && (
        <div className="space-y-6">
          {/* SÉLECTEUR DE MODALITÉ DE RÈGLEMENT (3 CHOIX TACTILES) */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700">
              Modalité de règlement souhaitée par le contribuable :
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Option 1 : Paiement Individuel */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  modaliteReglement === 'INDIVIDUEL'
                    ? 'border-fiscal-bordeaux bg-red-50/40 shadow-sm ring-1 ring-fiscal-bordeaux'
                    : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="modalite"
                  value="INDIVIDUEL"
                  checked={modaliteReglement === 'INDIVIDUEL'}
                  onChange={() => setModaliteReglement('INDIVIDUEL')}
                  className="mt-1 text-fiscal-bordeaux focus:ring-fiscal-bordeaux"
                />
                <div>
                  <div className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
                    <span>📄</span> Paiement Individuel
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    Règlement immédiat (comptant ou acompte) d'une créance fiscale spécifique.
                  </div>
                </div>
              </label>

              {/* Option 2 : Paiement Groupé */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  modaliteReglement === 'GROUPE'
                    ? 'border-fiscal-bordeaux bg-red-50/40 shadow-sm ring-1 ring-fiscal-bordeaux'
                    : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="modalite"
                  value="GROUPE"
                  checked={modaliteReglement === 'GROUPE'}
                  onChange={() => setModaliteReglement('GROUPE')}
                  className="mt-1 text-fiscal-bordeaux focus:ring-fiscal-bordeaux"
                />
                <div>
                  <div className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
                    <span>📑</span> Paiement Groupé
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    Règlement consolidé de plusieurs créances d'un même contribuable en une seule opération.
                  </div>
                </div>
              </label>

              {/* Option 3 : Paiement Échelonné (Moratoire) */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  modaliteReglement === 'MORATOIRE'
                    ? 'border-fiscal-bordeaux bg-amber-50/50 shadow-sm ring-1 ring-fiscal-bordeaux'
                    : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="modalite"
                  value="MORATOIRE"
                  checked={modaliteReglement === 'MORATOIRE'}
                  onChange={() => setModaliteReglement('MORATOIRE')}
                  className="mt-1 text-fiscal-bordeaux focus:ring-fiscal-bordeaux"
                />
                <div>
                  <div className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
                    <span>📅</span> Paiement Échelonné (Moratoire)
                    <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded">
                      CGI Madagascar
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    Accord officiel pour répartir le solde dû sur 2 à 36 mensualités avec convention signée.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* CAS 1 : PAIEMENT INDIVIDUEL (COMPTANT) */}
          {modaliteReglement === 'INDIVIDUEL' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Formulaire (7 cols) */}
              <form onSubmit={gererPaiementIndividuel} className="lg:col-span-7 rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                    <span>📄</span> Enregistrement d'un Versement Individuel
                  </h3>
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={afficherToutesDettes}
                      onChange={(e) => setAfficherToutesDettes(e.target.checked)}
                      className="rounded text-fiscal-bordeaux"
                    />
                    <span>Inclure créances soldées</span>
                  </label>
                </div>

                {/* Filtre de recherche créance */}
                <div>
                  <input
                    type="text"
                    placeholder="Filtrer par nom contribuable, NIF, impôt..."
                    value={rechercheContribuable}
                    onChange={(e) => setRechercheContribuable(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-fiscal-bordeaux focus:ring-1 focus:ring-fiscal-bordeaux"
                  />
                </div>

                {/* Sélecteur de créance */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Créance fiscale du contribuable *
                  </label>
                  <select
                    value={detteSelectionneeId}
                    onChange={(e) => {
                      const id = e.target.value === '' ? '' : Number(e.target.value);
                      setDetteSelectionneeId(id);
                      if (id !== '') {
                        const trouvee = dettes.find((d) => d.id === id);
                        if (trouvee) setMontant(trouvee.soldeRestant);
                      } else {
                        setMontant('');
                      }
                    }}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs bg-white focus:border-fiscal-bordeaux focus:ring-1 focus:ring-fiscal-bordeaux shadow-sm"
                  >
                    <option value="">-- Choisir une créance parmi les contribuables --</option>
                    {dettesFiltrees.map((d) => (
                      <option key={d.id} value={d.id}>
                        [#{d.id}] {d.nomContribuable} — {d.impot} ({d.periodeFiscale}) — Reste : {d.soldeRestant.toLocaleString('fr-FR')} Ar ({d.statut})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Montant encaissé */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Montant encaissé en Ariary (Ar) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={montant}
                    onChange={(e) => setMontant(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-bold text-gray-900 font-mono focus:border-fiscal-bordeaux focus:ring-1 focus:ring-fiscal-bordeaux"
                    placeholder="Montant du versement..."
                  />
                  {detteUniqueChoisie && (
                    <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
                      <span>Solde restant exigible : <strong>{formaterMontant(detteUniqueChoisie.soldeRestant)}</strong></span>
                      <button
                        type="button"
                        onClick={() => setMontant(detteUniqueChoisie.soldeRestant)}
                        className="text-fiscal-bordeaux font-semibold hover:underline"
                      >
                        Solder l'intégralité
                      </button>
                    </div>
                  )}
                </div>

                {/* Date, Mode et référence */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Date d'encaissement *</label>
                    <input
                      type="date"
                      required
                      value={dateEncaissement}
                      onChange={(e) => setDateEncaissement(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs bg-white font-mono focus:border-fiscal-bordeaux focus:ring-1 focus:ring-fiscal-bordeaux"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Mode de règlement *</label>
                    <select
                      value={modePaiement}
                      onChange={(e) => setModePaiement(e.target.value as ModePaiement)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs bg-white focus:border-fiscal-bordeaux focus:ring-1 focus:ring-fiscal-bordeaux"
                    >
                      {MODES_PAIEMENT.map((m) => (
                        <option key={m} value={m}>
                          {m === 'ESPECES' ? '💵 Espèces' : m === 'VIREMENT' ? '🏦 Virement' : m === 'MOBILE_MONEY' ? '📱 Mobile Money' : '📜 Chèque'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Référence justificative</label>
                    <input
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="N° Chèque, TXID..."
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs bg-white focus:border-fiscal-bordeaux focus:ring-1 focus:ring-fiscal-bordeaux"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    enCours={enCours}
                    className="w-full py-3 text-xs font-extrabold !bg-fiscal-bordeaux text-white shadow-md hover:!bg-[#631818]"
                  >
                    💳 Valider l'Encaissement & Émettre la Quittance DGI
                  </Button>
                </div>
              </form>

              {/* Fiche récapitulative & Informations (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                {detteUniqueChoisie ? (
                  <div className="rounded-xl border border-red-200 bg-white p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <span className="text-xs font-extrabold text-red-900 uppercase tracking-wider">
                        Créance N° {detteUniqueChoisie.id}
                      </span>
                      <StatutDetteBadge statut={detteUniqueChoisie.statut} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-gray-900 text-sm">{detteUniqueChoisie.nomContribuable}</h4>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">
                        {detteUniqueChoisie.impot} · Période {detteUniqueChoisie.periodeFiscale}
                      </p>
                    </div>
                    <div className="rounded-lg bg-red-50 p-3 space-y-1 text-xs">
                      <div className="flex justify-between text-gray-600">
                        <span>Montant dû :</span>
                        <span className="font-mono">{formaterMontant(detteUniqueChoisie.montantDu)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Déjà réglé :</span>
                        <span className="font-mono text-emerald-700">{formaterMontant(detteUniqueChoisie.montantPaye)}</span>
                      </div>
                      <div className="flex justify-between font-extrabold text-fiscal-bordeaux border-t border-red-200/60 pt-1 text-sm">
                        <span>Solde exigible :</span>
                        <span className="font-mono">{formaterMontant(detteUniqueChoisie.soldeRestant)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-xs text-gray-500">
                    <span className="text-3xl block mb-2">💡</span>
                    Sélectionnez une créance fiscale pour afficher les détails comptables et le solde restant.
                  </div>
                )}

                {/* Quittances récentes générées */}
                {quittancesRecentes.length > 0 && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
                    <h4 className="text-xs font-extrabold text-emerald-900 flex items-center gap-1.5">
                      <span>🧾</span> Dernières Quittances Émises :
                    </h4>
                    {quittancesRecentes.map((q) => (
                      <div key={q.id} className="rounded-lg bg-white p-2.5 border border-emerald-100 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-mono font-bold text-gray-900">{q.numeroQuittance || `QUIT-${q.id}`}</span>
                          <span className="text-gray-500 block text-[11px]">{formaterMontant(q.montant)}</span>
                        </div>
                        <Button
                          onClick={() => void telechargerQuittance(q.id)}
                          enCours={telechargementEnCoursId === q.id}
                          className="text-[11px] !py-1 !px-2.5 !bg-emerald-700 text-white"
                        >
                          📄 PDF
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CAS 2 : PAIEMENT GROUPÉ (MULTI-CRÉANCES) */}
          {modaliteReglement === 'GROUPE' && (
            <form onSubmit={gererPaiementGroupe} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
              <div className="border-b border-gray-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                    <span>📑</span> Règlement Consolidé Multi-Créances
                  </h3>
                  <p className="text-xs text-gray-500">
                    Cochez les créances à imputer dans ce versement global.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500 block">Total cumulé :</span>
                  <span className="text-lg font-black text-fiscal-bordeaux font-mono">
                    {formaterMontant(totalMontantMultiple)}
                  </span>
                </div>
              </div>

              {/* Liste à cocher des créances */}
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 border rounded-lg border-gray-200">
                {dettesFiltrees.map((d) => {
                  const estCoche = dettesSelectionneesIds.includes(d.id);
                  return (
                    <div
                      key={d.id}
                      className={`p-3 flex items-center justify-between gap-3 transition-colors ${
                        estCoche ? 'bg-red-50/40' : 'hover:bg-gray-50'
                      }`}
                    >
                      <label className="flex items-center gap-3 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={estCoche}
                          onChange={() => toggleSelectionMultiple(d)}
                          className="rounded text-fiscal-bordeaux focus:ring-fiscal-bordeaux h-4 w-4"
                        />
                        <div>
                          <div className="font-extrabold text-xs text-gray-900">{d.nomContribuable}</div>
                          <div className="text-[11px] text-gray-500 font-mono">
                            [#{d.id}] {d.impot} ({d.periodeFiscale}) · Reste : {formaterMontant(d.soldeRestant)}
                          </div>
                        </div>
                      </label>

                      {estCoche && (
                        <div className="w-36">
                          <input
                            type="number"
                            min={1}
                            max={d.soldeRestant}
                            value={montantsParDette[d.id] || ''}
                            onChange={(e) => changerMontantDetteMultiple(d.id, Number(e.target.value))}
                            className="w-full rounded border border-gray-300 px-2.5 py-1 text-xs font-mono font-bold text-gray-900"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Date, Mode et référence */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Date d'encaissement *</label>
                  <input
                    type="date"
                    required
                    value={dateEncaissement}
                    onChange={(e) => setDateEncaissement(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs bg-white font-mono focus:border-fiscal-bordeaux focus:ring-1 focus:ring-fiscal-bordeaux"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Mode de règlement *</label>
                  <select
                    value={modePaiement}
                    onChange={(e) => setModePaiement(e.target.value as ModePaiement)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs bg-white"
                  >
                    {MODES_PAIEMENT.map((m) => (
                      <option key={m} value={m}>
                        {m === 'ESPECES' ? '💵 Espèces' : m === 'VIREMENT' ? '🏦 Virement' : m === 'MOBILE_MONEY' ? '📱 Mobile Money' : '📜 Chèque'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Référence globale</label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Bordereau global, virement consolidé..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs bg-white"
                  />
                </div>
              </div>

              <Button
                type="submit"
                enCours={enCours}
                disabled={dettesSelectionneesIds.length === 0}
                className="w-full py-3 text-xs font-extrabold !bg-fiscal-bordeaux text-white shadow-md"
              >
                💳 Valider le Règlement Groupé ({dettesSelectionneesIds.length} créances · {formaterMontant(totalMontantMultiple)})
              </Button>
            </form>
          )}

          {/* CAS 3 : PAIEMENT ÉCHELONNÉ (SIMULATEUR DE MORATOIRE INTÉGRÉ) */}
          {modaliteReglement === 'MORATOIRE' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Formulaire de configuration du moratoire (6 cols) */}
              <form onSubmit={gererCreationMoratoire} className="lg:col-span-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                    <span>📅</span> Configuration de l'Accord de Moratoire
                  </h3>
                  <p className="text-xs text-gray-500">
                    Définissez les mensualités accordées pour le règlement échelonné de la dette fiscale.
                  </p>
                </div>

                {/* Sélection de créance */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Créance fiscale concernée *
                  </label>
                  <select
                    value={detteMoratoireId}
                    onChange={(e) => setDetteMoratoireId(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs bg-white focus:border-fiscal-bordeaux focus:ring-1 focus:ring-fiscal-bordeaux"
                  >
                    <option value="">-- Choisir une créance à échelonner --</option>
                    {dettesFiltrees.map((d) => (
                      <option key={d.id} value={d.id}>
                        [#{d.id}] {d.nomContribuable} — {d.impot} ({d.periodeFiscale}) — Solde : {d.soldeRestant.toLocaleString('fr-FR')} Ar
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nombre de mensualités & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Nombre de mensualités ({nombreEcheances} mois) *
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={36}
                      value={nombreEcheances}
                      onChange={(e) => setNombreEcheances(Math.max(2, Number(e.target.value)))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold font-mono"
                    />
                    <div className="flex gap-1.5 mt-1.5">
                      {[3, 6, 12, 24].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setNombreEcheances(n)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                            nombreEcheances === n
                              ? 'bg-fiscal-bordeaux text-white border-fiscal-bordeaux'
                              : 'bg-gray-100 text-gray-700 border-gray-200'
                          }`}
                        >
                          {n} mois
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Date de 1ère échéance *
                    </label>
                    <input
                      type="date"
                      required
                      value={dateDebutMoratoire}
                      onChange={(e) => setDateDebutMoratoire(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs bg-white"
                    />
                  </div>
                </div>

                {/* Motif / Commentaire */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Motif de l'accord ou décision administrative
                  </label>
                  <textarea
                    value={commentaireMoratoire}
                    onChange={(e) => setCommentaireMoratoire(e.target.value)}
                    rows={2}
                    placeholder="Accord de facilité de trésorerie, décision de la Direction..."
                    className="w-full rounded-lg border border-gray-300 p-2 text-xs"
                  />
                </div>

                <Button
                  type="submit"
                  enCours={enCours}
                  disabled={!detteMoratoireId}
                  className="w-full py-3 text-xs font-extrabold !bg-fiscal-bordeaux text-white shadow-md hover:!bg-[#631818]"
                >
                  📑 Valider l'Accord de Moratoire & Émettre la Convention DGI
                </Button>
              </form>

              {/* Simulateur d'échéancier en temps réel (6 cols) */}
              <div className="lg:col-span-6 space-y-4">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                      <span>🧮</span> Aperçu de l'Échéancier Mensuel (Simulation)
                    </h4>
                    {detteMoratoireChoisie && (
                      <span className="font-mono font-bold text-xs text-fiscal-bordeaux">
                        Total : {formaterMontant(detteMoratoireChoisie.soldeRestant)}
                      </span>
                    )}
                  </div>

                  {echeancierSimule.length === 0 ? (
                    <div className="py-12 text-center text-xs text-gray-400">
                      <span className="text-3xl block mb-2">📋</span>
                      Sélectionnez une créance fiscale à gauche pour générer la simulation automatique du calendrier de règlement.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 border rounded-lg border-gray-200">
                        {echeancierSimule.map((ech) => (
                          <div key={ech.numero} className="p-2.5 flex items-center justify-between text-xs hover:bg-gray-50">
                            <div className="flex items-center gap-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-fiscal-bordeaux text-[10px] font-bold">
                                {ech.numero}
                              </span>
                              <span className="text-gray-700 font-medium">Échéance N° {ech.numero}</span>
                            </div>
                            <span className="font-mono text-gray-500 text-[11px]">{formaterDateFr(ech.date)}</span>
                            <span className="font-mono font-extrabold text-gray-900 text-xs">
                              {formaterMontant(ech.montant)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-[11px] text-amber-900 leading-relaxed">
                        <strong>Règle juridique CGI :</strong> En cas de défaut de paiement d'une seule échéance non justifié sous 15 jours, l'accord est réputé caduc de plein droit et les poursuites reprennent pour la totalité du solde.
                      </div>
                    </div>
                  )}
                </div>

                {/* Moratoire récemment créé */}
                {moratoireCreeSucces && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900">
                        🎉 Convention N° {moratoireCreeSucces.reference || moratoireCreeSucces.id} prête !
                      </span>
                      <Button
                        onClick={() => void telechargerConventionPdf(moratoireCreeSucces.id)}
                        enCours={telechargementConventionId === moratoireCreeSucces.id}
                        className="text-xs !py-1 !px-2.5 !bg-emerald-700 text-white"
                      >
                        📄 Télécharger Convention PDF
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. CONTENU ONGLET 2 : REGISTRE DES QUITTANCES OFFICIELLES DGI             */}
      {/* ========================================================================= */}
      {ongletActif === 'REGISTRE' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <input
              type="text"
              placeholder="Rechercher par N° quittance, contribuable, NIF, mode..."
              value={rechercheRegistre}
              onChange={(e) => {
                setRechercheRegistre(e.target.value);
                setPageRegistre(1);
              }}
              className="w-full sm:w-80 rounded-lg border border-gray-300 px-3.5 py-1.5 text-xs focus:border-fiscal-bordeaux focus:ring-1 focus:ring-fiscal-bordeaux"
            />
            <div className="text-xs text-gray-500 font-mono">
              Total quittances enregistrées : <strong>{paiementsFiltres.length}</strong>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100/80 border-b border-gray-200 text-gray-600 font-extrabold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">N° Quittance</th>
                    <th className="py-3 px-3">Date & Heure</th>
                    <th className="py-3 px-4">Contribuable & NIF</th>
                    <th className="py-3 px-3">Mode & Référence</th>
                    <th className="py-3 px-3 text-right">Montant Encaissé</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-sans">
                  {paiementsPaginees.map((p) => (
                    <tr key={p.id} className="hover:bg-red-50/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">
                        {p.numeroQuittance || `QUIT-${p.id}`}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-gray-500">
                        {p.datePaiement ? formaterDateHeureFr(p.datePaiement) : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-gray-900">{p.nomContribuable || '—'}</div>
                        <div className="text-[11px] text-gray-400 font-mono">NIF : {p.nif || '—'}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-800">
                          {p.modePaiement}
                        </span>
                        {p.reference && (
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5">{p.reference}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-emerald-700 text-xs">
                        {formaterMontant(p.montant)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          onClick={() => void telechargerQuittance(p.id)}
                          enCours={telechargementEnCoursId === p.id}
                          className="text-xs !py-1 !px-2.5 !bg-fiscal-bordeaux text-white shadow-sm"
                        >
                          📄 Quittance PDF
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {paiementsFiltres.length > elementsParPageRegistre && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600 pt-2">
              <div className="flex items-center gap-2">
                <span>Afficher</span>
                <select
                  value={elementsParPageRegistre}
                  onChange={(e) => {
                    setElementsParPageRegistre(Number(e.target.value));
                    setPageRegistre(1);
                  }}
                  className="rounded border border-gray-300 px-2 py-1 text-xs bg-white"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>quittances par page · Total : {paiementsFiltres.length}</span>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variante="secondaire"
                  disabled={pageRegistre === 1}
                  onClick={() => setPageRegistre((p) => Math.max(1, p - 1))}
                  className="text-xs !py-1 !px-2.5"
                >
                  ← Précédent
                </Button>
                <span className="px-2 font-semibold">
                  Page {pageRegistre} sur {totalPagesRegistre}
                </span>
                <Button
                  variante="secondaire"
                  disabled={pageRegistre === totalPagesRegistre}
                  onClick={() => setPageRegistre((p) => Math.min(totalPagesRegistre, p + 1))}
                  className="text-xs !py-1 !px-2.5"
                >
                  Suivant →
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. CONTENU ONGLET 3 : SUIVI DES MORATOIRES & ÉCHÉANCIERS ACTIFS          */}
      {/* ========================================================================= */}
      {ongletActif === 'MORATOIRES' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <input
              type="text"
              placeholder="Rechercher par référence accord, nom contribuable, NIF..."
              value={rechercheMoratoire}
              onChange={(e) => setRechercheMoratoire(e.target.value)}
              className="w-full sm:w-80 rounded-lg border border-gray-300 px-3.5 py-1.5 text-xs focus:border-fiscal-bordeaux focus:ring-1 focus:ring-fiscal-bordeaux"
            />
            <Button
              onClick={() => {
                setOngletActif('ENCAISSEMENT');
                setModaliteReglement('MORATOIRE');
              }}
              className="!bg-fiscal-bordeaux text-white text-xs font-bold shadow-sm"
            >
              ➕ Nouvel Accord de Moratoire
            </Button>
          </div>

          {moratoiresFiltres.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white p-12 text-center space-y-2">
              <span className="text-3xl block">📅</span>
              <h4 className="text-sm font-bold text-gray-900">Aucun accord de moratoire trouvé</h4>
              <p className="text-xs text-gray-500">
                Vous pouvez créer un nouvel accord d'échelonnement depuis l'onglet Guichet de Règlement.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {moratoiresFiltres.map((m) => {
                const pct = m.pourcentagePaye ?? (m.montantTotal > 0 ? (m.montantTotalPaye / m.montantTotal) * 100 : 0);
                return (
                  <div
                    key={m.id}
                    className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-gray-100">
                        <div>
                          <span className="font-mono text-xs font-bold text-gray-900 block">
                            {m.reference || `MOR-${m.id}`}
                          </span>
                          <h4 className="font-extrabold text-sm text-gray-900 mt-0.5">{m.nomContribuable}</h4>
                          <span className="text-[11px] text-gray-400 font-mono">NIF : {m.nif}</span>
                        </div>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.statut === 'ACTIF'
                              ? 'bg-blue-100 text-blue-800'
                              : m.statut === 'SOLDE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {m.statut}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400 block text-[10px]">Créance liée :</span>
                          <span className="font-bold text-gray-800">{m.impot}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px]">Mensualités :</span>
                          <span className="font-bold text-gray-800">{m.nombreEcheances} mois</span>
                        </div>
                      </div>

                      {/* Progression du remboursement */}
                      <div className="mt-3 rounded-lg bg-gray-50 border border-gray-200/80 p-3 space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-gray-500">Remboursement</span>
                          <span className="font-mono text-gray-900">{Math.round(pct)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] pt-1">
                          <span className="text-emerald-700 font-mono font-bold">
                            {formaterMontant(m.montantTotalPaye)}
                          </span>
                          <span className="text-fiscal-bordeaux font-mono font-bold">
                            Reste : {formaterMontant(m.soldeRestantMoratoire)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                      <Button
                        onClick={() => void telechargerConventionPdf(m.id)}
                        enCours={telechargementConventionId === m.id}
                        className="text-xs !py-1 !px-2.5 !bg-gray-100 !text-gray-800 hover:!bg-gray-200 border border-gray-300"
                      >
                        📄 Convention PDF
                      </Button>

                      <button
                        type="button"
                        onClick={() => setMoratoireDetail(m)}
                        className="rounded-lg bg-fiscal-bordeaux px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#601414]"
                      >
                        👁️ Échéancier
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL DE DÉTAIL D'UN MORATOIRE & PAIEMENT D'ÉCHÉANCE                   */}
      {/* ========================================================================= */}
      {moratoireDetail && (
        <Modal
          ouverte={Boolean(moratoireDetail)}
          titre={`Accord de Moratoire : ${moratoireDetail.reference || moratoireDetail.id}`}
          taille="2xl"
          onFermer={() => setMoratoireDetail(null)}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h4 className="font-extrabold text-sm text-gray-900">{moratoireDetail.nomContribuable}</h4>
                <p className="text-xs text-gray-500 font-mono">NIF : {moratoireDetail.nif} · Impôt : {moratoireDetail.impot}</p>
              </div>
              <Button
                onClick={() => void telechargerConventionPdf(moratoireDetail.id)}
                enCours={telechargementConventionId === moratoireDetail.id}
                className="text-xs !bg-fiscal-bordeaux text-white"
              >
                📄 Télécharger Convention
              </Button>
            </div>

            {/* Calendrier des mensualités */}
            <h5 className="text-xs font-extrabold uppercase text-gray-700">Calendrier des Échéances :</h5>
            <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 border rounded-lg border-gray-200">
              {moratoireDetail.echeances?.map((ech) => {
                const estPaye = ech.statut === 'PAYE';
                return (
                  <div key={ech.id} className="p-3 flex items-center justify-between text-xs hover:bg-gray-50">
                    <div>
                      <div className="font-bold text-gray-900">Échéance N° {ech.numeroEcheance}</div>
                      <div className="text-[11px] text-gray-400 font-mono">
                        Date limite : {formaterDateFr(ech.dateEcheance)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-gray-900">{formaterMontant(ech.montant)}</div>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.2 text-[10px] font-bold ${
                          estPaye ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {estPaye ? '✓ Soldé' : '⏳ En attente'}
                      </span>
                    </div>

                    {!estPaye && (
                      <button
                        type="button"
                        onClick={() => {
                          setEcheanceAPayer(ech);
                          setMontantEcheance(ech.montant);
                        }}
                        className="rounded-lg bg-emerald-700 px-3 py-1 text-xs font-bold text-white shadow-sm hover:bg-emerald-800"
                      >
                        💳 Payer
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL PAIEMENT D'UNE ÉCHÉANCE DE MORATOIRE */}
      {echeanceAPayer && (
        <Modal
          ouverte={Boolean(echeanceAPayer)}
          titre={`Règlement de l'Échéance N° ${echeanceAPayer.numeroEcheance}`}
          taille="md"
          onFermer={() => setEcheanceAPayer(null)}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Montant à régler (Ar) *</label>
              <input
                type="number"
                value={montantEcheance}
                onChange={(e) => setMontantEcheance(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-bold font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Mode de règlement *</label>
              <select
                value={modePaiementEch}
                onChange={(e) => setModePaiementEch(e.target.value as ModePaiement)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs bg-white"
              >
                {MODES_PAIEMENT.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Référence justificative</label>
              <input
                type="text"
                value={referenceEch}
                onChange={(e) => setReferenceEch(e.target.value)}
                placeholder="N° Chèque, bordereau..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs bg-white"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                onClick={() => void payerEcheance()}
                enCours={paiementEcheanceEnCours}
                className="!bg-emerald-700 text-white text-xs font-bold"
              >
                ✓ Valider le règlement de l'échéance
              </Button>
              <Button
                variante="secondaire"
                onClick={() => setEcheanceAPayer(null)}
                className="text-xs"
              >
                Annuler
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}