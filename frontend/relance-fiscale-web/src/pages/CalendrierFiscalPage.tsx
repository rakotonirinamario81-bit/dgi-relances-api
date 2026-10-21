import { useEffect, useState } from 'react';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Table, type ColonneTable } from '@/components/common/Table';
import { calendrierFiscalService } from '@/services/calendrierFiscalService';
import { apiClient, extraireMessageErreur } from '@/services/apiClient';
import type { CalendrierFiscal } from '@/types/calendrierFiscal.types';
import type { Impot } from '@/types/impot.types';

export function CalendrierFiscalPage() {
  const [regles, setRegles] = useState<CalendrierFiscal[]>([]);
  const [impots, setImpots] = useState<Impot[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  // Simulateur
  const [simulImpotId, setSimulImpotId] = useState<number>(0);
  const [simulPeriode, setSimulPeriode] = useState<string>('2026-06');
  const [dateCalculee, setDateCalculee] = useState<string | null>(null);
  const [calculEnCours, setCalculEnCours] = useState(false);

  // Modal Génération d'échéances
  const [modalGenerationOuverte, setModalGenerationOuverte] = useState(false);
  const [genImpotId, setGenImpotId] = useState<number>(0);
  const [genPeriode, setGenPeriode] = useState<string>('2026-06');
  const [generationEnCours, setGenerationEnCours] = useState(false);
  const [messageSuccesGen, setMessageSuccesGen] = useState<string | null>(null);


  async function chargerDonnees() {
    setChargement(true);
    setErreur(null);
    try {
      const [reglesData, impotsData] = await Promise.all([
        calendrierFiscalService.listerRegles(),
        apiClient.get<Impot[]>('/impots').then((r) => r.data),
      ]);
      setRegles(reglesData);
      setImpots(impotsData);
      if (impotsData.length > 0) {
        setSimulImpotId(impotsData[0].id);
        setGenImpotId(impotsData[0].id);
      }
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    void chargerDonnees();
  }, []);

  async function testerCalcul() {
    if (!simulImpotId || !simulPeriode) return;
    setCalculEnCours(true);
    try {
      const res = await calendrierFiscalService.calculerDateLimite(simulImpotId, simulPeriode);
      setDateCalculee(res.dateLimite);
    } catch {
      setDateCalculee(null);
    } finally {
      setCalculEnCours(false);
    }
  }

  useEffect(() => {
    if (simulImpotId && simulPeriode) {
      void testerCalcul();
    }
  }, [simulImpotId, simulPeriode]);

  async function gererGeneration() {
    if (!genImpotId || !genPeriode) return;
    setGenerationEnCours(true);
    setMessageSuccesGen(null);
    setErreur(null);
    try {
      const res = await calendrierFiscalService.genererEcheances(genImpotId, genPeriode);
      setMessageSuccesGen(`${res.message} : ${res.nombreEcheancesCreees} nouvelle(s) échéance(s) créée(s).`);
      setTimeout(() => {
        setModalGenerationOuverte(false);
        setMessageSuccesGen(null);
      }, 2500);
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setGenerationEnCours(false);
    }
  }

  const colonnes: ColonneTable<CalendrierFiscal>[] = [
    {
      cle: 'impotCode',
      entete: 'Code',
      rendu: (r) => <span className="font-semibold text-fiscal-bordeaux">{r.impotCode}</span>,
    },
    {
      cle: 'impotLibelle',
      entete: 'Nature de l’impôt',
      rendu: (r) => r.impotLibelle,
    },
    {
      cle: 'impotPeriodicite',
      entete: 'Périodicité',
      rendu: (r) => (
        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
          {r.impotPeriodicite}
        </span>
      ),
    },
    {
      cle: 'regleTexte',
      entete: 'Échéance légale (Code Général des Impôts)',
      rendu: (r) => <span className="font-medium text-gray-900">{r.regleTexte}</span>,
    },
    {
      cle: 'delaiGraceJours',
      entete: 'Délai de grâce',
      rendu: (r) => `${r.delaiGraceJours} jour(s)`,
      alignementDroite: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendrier Fiscal de Madagascar</h1>
          <p className="text-sm text-gray-600">
            Règles d’échéances légales automatiques selon le Code Général des Impôts (DGI Madagascar).
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setModalGenerationOuverte(true)}>
            ⚡ Générer les échéances
          </Button>
        </div>
      </div>

      {erreur && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{erreur}</div>
      )}

      {/* Simulateur / Calculateur automatique */}
      <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-5 shadow-sm">
        <h2 className="text-base font-semibold text-amber-900 mb-2">
          🔍 Simulateur de calcul automatique d’échéance
        </h2>
        <p className="text-xs text-amber-700 mb-4">
          Testez le calcul automatisé de la date limite légale sans saisie manuelle.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Impôt</label>
            <select
              value={simulImpotId}
              onChange={(e) => setSimulImpotId(Number(e.target.value))}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              {impots.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.code} — {i.libelle} ({i.periodicite})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Période fiscale (ex: 2026-06 ou 2026)</label>
            <input
              type="text"
              value={simulPeriode}
              onChange={(e) => setSimulPeriode(e.target.value)}
              placeholder="ex: 2026-06"
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm font-mono"
            />
          </div>

          <div className="rounded bg-white border border-amber-300 p-2.5 text-center">
            <span className="text-xs text-gray-500 block">Échéance légale calculée :</span>
            <span className="text-lg font-bold text-fiscal-bordeaux font-mono">
              {calculEnCours ? 'Calcul...' : dateCalculee ?? '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Tableau des règles */}
      <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Règles d’échéances par nature d’impôt</h2>
          <span className="text-xs text-gray-500">{regles.length} règle(s) enregistrée(s)</span>
        </div>

        <Table
          colonnes={colonnes}
          donnees={regles}
          cleLigne={(r) => r.id}
          chargement={chargement}
          messageVide="Aucune règle de calendrier configurée"
        />
      </div>

      {/* Modal Génération d'échéances pour tous les contribuables */}
      <Modal
        ouverte={modalGenerationOuverte}
        titre="Générer automatiquement les échéances fiscales"
        onFermer={() => setModalGenerationOuverte(false)}
        pied={
          <>
            <Button variante="secondaire" onClick={() => setModalGenerationOuverte(false)}>
              Annuler
            </Button>
            <Button onClick={gererGeneration} enCours={generationEnCours}>
              Lancer la génération
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Cette opération crée automatiquement une échéance légale pour tous les contribuables enregistrés,
            avec calcul instantané de la date limite selon le calendrier fiscal de Madagascar.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Impôt concerné</label>
            <select
              value={genImpotId}
              onChange={(e) => setGenImpotId(Number(e.target.value))}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            >
              {impots.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.code} — {i.libelle}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Période fiscale</label>
            <input
              type="text"
              value={genPeriode}
              onChange={(e) => setGenPeriode(e.target.value)}
              placeholder="ex: 2026-06 ou 2026"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">
              Format : <span className="font-mono">AAAA-MM</span> pour mensuel (ex: 2026-06), ou <span className="font-mono">AAAA</span> pour annuel (ex: 2026).
            </p>
          </div>

          {messageSuccesGen && (
            <div className="rounded bg-green-50 p-3 text-sm text-green-700 border border-green-200">
              {messageSuccesGen}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
