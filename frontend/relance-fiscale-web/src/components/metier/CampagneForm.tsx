import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { modeleMessageService } from '@/services/modeleMessageService';
import { campagneRelanceService } from '@/services/campagneRelanceService';
import { detteFiscaleService } from '@/services/detteFiscaleService';
import type { CampagneRelanceDTO, EstimationCiblage } from '@/types/campagneRelance.types';
import type { ModeleMessage } from '@/types/modeleMessage.types';
import type { NiveauRisque } from '@/types/detteFiscale.types';
import { formaterMontant } from '@/utils/formatDate';

interface CampagneFormProps {
  onSoumettre: (dto: CampagneRelanceDTO) => Promise<void>;
  enCours?: boolean;
}

export function CampagneForm({ onSoumettre, enCours }: CampagneFormProps) {
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [impotCibleId, setImpotCibleId] = useState<number | ''>('');
  const [periodeFiscaleCible, setPeriodeFiscaleCible] = useState('');
  const [joursRetardMin, setJoursRetardMin] = useState<number | ''>(15);
  const [niveauRisqueCible, setNiveauRisqueCible] = useState<NiveauRisque | ''>('');
  const [modeleMessageId, setModeleMessageId] = useState<number | ''>('');
  const [dateDebut, setDateDebut] = useState(new Date().toISOString().split('T')[0]);
  const [dateFin, setDateFin] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  // Données dynamiques
  const [modeles, setModeles] = useState<ModeleMessage[]>([]);
  const [impotsDisponibles, setImpotsDisponibles] = useState<Array<{ id: number; code: string }>>([]);
  const [chargementDonnees, setChargementDonnees] = useState(true);

  // Estimation de ciblage en direct
  const [estimation, setEstimation] = useState<EstimationCiblage | null>(null);
  const [estimationEnCours, setEstimationEnCours] = useState(false);

  // Charger les modèles et impôts
  useEffect(() => {
    let ignore = false;
    async function charger() {
      setChargementDonnees(true);
      try {
        const [modelesData, dettesData] = await Promise.all([
          modeleMessageService.listerTous(),
          detteFiscaleService.listerToutes(),
        ]);

        if (!ignore) {
          setModeles(modelesData);
          if (modelesData.length > 0) {
            setModeleMessageId(modelesData[0].id);
          }

          // Extraire impôts uniques
          const mapImpots = new Map<number, string>();
          dettesData.forEach((d) => {
            if (d.impotId && d.impot) {
              mapImpots.set(d.impotId, d.impot);
            }
          });
          setImpotsDisponibles(Array.from(mapImpots.entries()).map(([id, code]) => ({ id, code })));
        }
      } catch (err) {
        console.error('Erreur chargement modèles ou impôts :', err);
      } finally {
        if (!ignore) setChargementDonnees(false);
      }
    }
    void charger();
    return () => {
      ignore = true;
    };
  }, []);

  // Calcul d'estimation en direct
  const actualiserEstimation = useCallback(async () => {
    setEstimationEnCours(true);
    try {
      const data = await campagneRelanceService.estimerCiblage({
        impotId: impotCibleId === '' ? undefined : impotCibleId,
        periode: periodeFiscaleCible.trim() || undefined,
        joursRetardMin: joursRetardMin === '' ? undefined : Number(joursRetardMin),
        niveauRisque: niveauRisqueCible === '' ? undefined : niveauRisqueCible,
      });
      setEstimation(data);
    } catch {
      setEstimation(null);
    } finally {
      setEstimationEnCours(false);
    }
  }, [impotCibleId, periodeFiscaleCible, joursRetardMin, niveauRisqueCible]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void actualiserEstimation();
    }, 300);
    return () => clearTimeout(timer);
  }, [actualiserEstimation]);

  // Modèles prédéfinis rapides
  function appliquerPreselection(type: 'TVA' | 'RISQUE_ELEVE' | 'AMIABLE') {
    if (type === 'TVA') {
      const impotTva = impotsDisponibles.find((i) => i.code.toUpperCase().includes('TVA'));
      setNom('Campagne Ciblée TVA — Retard > 15 jours');
      setDescription('Relance groupée par Email pour l’ensemble des entreprises en retard de liquidation de TVA.');
      if (impotTva) setImpotCibleId(impotTva.id);
      setJoursRetardMin(15);
      setNiveauRisqueCible('');
    } else if (type === 'RISQUE_ELEVE') {
      setNom('Opération Recouvrement Forcé — Dettes à Risque Élevé');
      setDescription('Sommation officielle par email avant poursuites et exécution d’Avis à Tiers Détenteur.');
      setJoursRetardMin(60);
      setNiveauRisqueCible('RISQUE_ELEVE');
    } else {
      setNom('Rappel Amiable Déclaratif Généralisé');
      setDescription('Notification préventive et bienveillante adressée aux contribuables pour faciliter la conformité.');
      setJoursRetardMin(5);
      setNiveauRisqueCible('');
      setImpotCibleId('');
    }
  }

  async function gererSoumission(e: FormEvent) {
    e.preventDefault();
    if (!modeleMessageId || !dateDebut || !nom.trim()) return;

    await onSoumettre({
      nom: nom.trim(),
      description: description.trim() || undefined,
      impotCibleId: impotCibleId === '' ? undefined : Number(impotCibleId),
      periodeFiscaleCible: periodeFiscaleCible.trim() || undefined,
      joursRetardMin: joursRetardMin === '' ? undefined : Number(joursRetardMin),
      niveauRisqueCible: niveauRisqueCible || undefined,
      modeleMessageId: Number(modeleMessageId),
      dateDebut,
      dateFin: dateFin || undefined,
    });
  }

  return (
    <form onSubmit={gererSoumission} className="space-y-5">
      {/* Boutons de préconfiguration rapide */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
          Configurations pré-établies DGI :
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => appliquerPreselection('TVA')}
            className="rounded-lg border border-red-200 bg-red-50/60 px-2.5 py-1 text-xs font-semibold text-red-900 hover:bg-red-100 transition-colors"
          >
            🎯 Retard TVA &gt; 15j
          </button>
          <button
            type="button"
            onClick={() => appliquerPreselection('RISQUE_ELEVE')}
            className="rounded-lg border border-amber-200 bg-amber-50/60 px-2.5 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors"
          >
            ⚡ Risque Élevé &gt; 60j (Sommation)
          </button>
          <button
            type="button"
            onClick={() => appliquerPreselection('AMIABLE')}
            className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-2.5 py-1 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 transition-colors"
          >
            🌱 Rappel Amiable Général
          </button>
        </div>
      </div>

      {/* Informations générales */}
      <div className="space-y-3">
        <Input
          label="Nom officiel de la campagne *"
          required
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="ex. Campagne Nationale TVA — Premier Semestre 2026"
        />

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Description & Objectifs stratégiques
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-300 p-2 text-xs focus:border-fiscal-bordeaux focus:ring-1 focus:ring-fiscal-bordeaux"
            placeholder="Précisez le cadre de la campagne de relance..."
          />
        </div>
      </div>

      {/* Critères de ciblage multicritère */}
      <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
          <span>🎯</span> Critères de Ciblage Automatique des Contribuables
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Impôt ciblé */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Impôt Cible</label>
            <select
              value={impotCibleId}
              onChange={(e) => setImpotCibleId(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs bg-white focus:border-fiscal-bordeaux focus:ring-1 focus:ring-fiscal-bordeaux"
            >
              <option value="">Tous les impôts (Global)</option>
              {impotsDisponibles.map((imp) => (
                <option key={imp.id} value={imp.id}>
                  {imp.code}
                </option>
              ))}
            </select>
          </div>

          {/* Période fiscale */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Période Fiscale</label>
            <input
              type="text"
              value={periodeFiscaleCible}
              onChange={(e) => setPeriodeFiscaleCible(e.target.value)}
              placeholder="ex. 2026, 2026-06 ou T1-2026"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs bg-white focus:border-fiscal-bordeaux focus:ring-1 focus:ring-fiscal-bordeaux"
            />
          </div>

          {/* Retard minimum */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Seuil de retard minimum (jours)
            </label>
            <input
              type="number"
              min={0}
              value={joursRetardMin}
              onChange={(e) => setJoursRetardMin(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="ex. 15"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs bg-white focus:border-fiscal-bordeaux focus:ring-1 focus:ring-fiscal-bordeaux"
            />
          </div>

          {/* Niveau de risque */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Niveau de Risque IA</label>
            <select
              value={niveauRisqueCible}
              onChange={(e) => setNiveauRisqueCible(e.target.value as NiveauRisque | '')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs bg-white focus:border-fiscal-bordeaux focus:ring-1 focus:ring-fiscal-bordeaux"
            >
              <option value="">Tous niveaux de risque</option>
              <option value="RISQUE_FAIBLE">🟢 Risque Faible</option>
              <option value="RISQUE_MOYEN">🟡 Risque Moyen</option>
              <option value="RISQUE_ELEVE">🔴 Risque Élevé (Prioritaire)</option>
            </select>
          </div>
        </div>

        {/* Encadré d'estimation en direct */}
        <div className="rounded-lg border border-red-200/80 bg-red-50/60 p-3 text-xs">
          <div className="flex items-center justify-between font-bold text-red-900 mb-1.5">
            <span className="flex items-center gap-1.5">
              <span>📊</span>
              <span>Simulation de l'impact en direct :</span>
            </span>
            {estimationEnCours && <span className="text-[10px] animate-pulse">Calcul...</span>}
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded bg-white/80 p-1.5 border border-red-100">
              <span className="text-[10px] text-gray-500 block">Contribuables</span>
              <span className="text-sm font-extrabold text-gray-900">
                {estimation ? estimation.nombreContribuablesCibles : '—'}
              </span>
            </div>
            <div className="rounded bg-white/80 p-1.5 border border-red-100">
              <span className="text-[10px] text-gray-500 block">Créances</span>
              <span className="text-sm font-extrabold text-gray-900">
                {estimation ? estimation.nombreDettesCibles : '—'}
              </span>
            </div>
            <div className="rounded bg-white/80 p-1.5 border border-red-100">
              <span className="text-[10px] text-gray-500 block">Masse Vente</span>
              <span className="text-xs font-extrabold text-fiscal-bordeaux font-mono">
                {estimation ? formaterMontant(estimation.montantTotalCible) : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modèle de message & Calendrier */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Modèle de message */}
        <div className="sm:col-span-3">
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Modèle de Message Officiel (Notification) *
          </label>
          <select
            value={modeleMessageId}
            onChange={(e) => setModeleMessageId(e.target.value === '' ? '' : Number(e.target.value))}
            required
            disabled={chargementDonnees}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs bg-white focus:border-fiscal-bordeaux focus:ring-1 focus:ring-fiscal-bordeaux"
          >
            {modeles.map((m) => (
              <option key={m.id} value={m.id}>
                [{m.canal === 'SMS' ? '📱 SMS' : '📧 Email'}] {m.nom} {m.niveauRelanceAssocie ? `(${m.niveauRelanceAssocie})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Date début */}
        <div className="sm:col-span-1">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Date de début *</label>
          <input
            type="date"
            required
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs bg-white focus:border-fiscal-bordeaux focus:ring-1 focus:ring-fiscal-bordeaux"
          />
        </div>

        {/* Date fin */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Date de fin prévue</label>
          <input
            type="date"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs bg-white focus:border-fiscal-bordeaux focus:ring-1 focus:ring-fiscal-bordeaux"
          />
        </div>
      </div>

      {/* Bouton de validation */}
      <div className="pt-2 flex justify-end gap-2">
        <Button
          type="submit"
          enCours={enCours}
          className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold !bg-fiscal-bordeaux hover:!bg-[#631818]"
        >
          🚀 Créer la Campagne de Relance
        </Button>
      </div>
    </form>
  );
}