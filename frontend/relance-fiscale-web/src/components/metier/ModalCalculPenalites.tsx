import { useEffect, useState } from 'react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { penaliteService } from '@/services/penaliteService';
import { extraireMessageErreur } from '@/services/apiClient';
import type { DetteFiscale } from '@/types/detteFiscale.types';
import type { ResultatCalculPenalites } from '@/types/penalite.types';

interface ModalCalculPenalitesProps {
  dette: DetteFiscale;
  isOpen: boolean;
  onClose: () => void;
  onPenalitesAppliquees: () => void;
}

export function ModalCalculPenalites({
  dette,
  isOpen,
  onClose,
  onPenalitesAppliquees,
}: ModalCalculPenalitesProps) {
  const [dateCalcul, setDateCalcul] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [tauxPenalite, setTauxPenalite] = useState<number>(10.0);
  const [tauxInteretMensuel, setTauxInteretMensuel] = useState<number>(1.0);

  const [calcul, setCalcul] = useState<ResultatCalculPenalites | null>(null);
  const [chargementCalcul, setChargementCalcul] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // Remise gracieuse
  const [afficherSectionRemise, setAfficherSectionRemise] = useState(false);
  const [montantRemise, setMontantRemise] = useState<number>(0);
  const [motifRemise, setMotifRemise] = useState('');
  const [remiseEnCours, setRemiseEnCours] = useState(false);

  // Application & PDF
  const [applicationEnCours, setApplicationEnCours] = useState(false);
  const [telechargementEnCours, setTelechargementEnCours] = useState(false);
  const [messageSucces, setMessageSucces] = useState<string | null>(null);

  async function recalculerSimulation() {
    setChargementCalcul(true);
    setErreur(null);
    try {
      const res = await penaliteService.simuler(dette.id, {
        dateCalcul,
        tauxPenalite,
        tauxInteretMensuel,
      });
      setCalcul(res);
      if (res.remiseGracieuse > 0) {
        setMontantRemise(res.remiseGracieuse);
        setMotifRemise(res.motifRemise || '');
      }
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setChargementCalcul(false);
    }
  }

  useEffect(() => {
    if (isOpen) {
      setDateCalcul(new Date().toISOString().split('T')[0]);
      setTauxPenalite(10.0);
      setTauxInteretMensuel(1.0);
      setMessageSucces(null);
      void recalculerSimulation();
    }
  }, [isOpen, dette.id]);

  if (!isOpen) return null;

  async function gererApplication() {
    setApplicationEnCours(true);
    setErreur(null);
    try {
      await penaliteService.appliquer(dette.id, {
        dateCalcul,
        tauxPenalite,
        tauxInteretMensuel,
        remiseGracieuse: montantRemise > 0 ? montantRemise : undefined,
        motifRemise: motifRemise.trim() || undefined,
      });
      setMessageSucces('Décompte légal de pénalités appliqué avec succès sur la créance fiscale !');
      onPenalitesAppliquees();
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setApplicationEnCours(false);
    }
  }

  async function gererRemiseGracieuse() {
    if (montantRemise <= 0 || !motifRemise.trim()) {
      setErreur('Veuillez renseigner un montant de remise valide et un motif administratif.');
      return;
    }

    setRemiseEnCours(true);
    setErreur(null);
    try {
      const res = await penaliteService.accorderRemiseGracieuse(dette.id, {
        montantRemise,
        motif: motifRemise.trim(),
      });
      setCalcul(res);
      setMessageSucces(`Remise gracieuse de ${montantRemise.toLocaleString('fr-FR')} Ar accordée avec succès.`);
      setAfficherSectionRemise(false);
      onPenalitesAppliquees();
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setRemiseEnCours(false);
    }
  }

  async function telechargerPdf() {
    setTelechargementEnCours(true);
    try {
      await penaliteService.telechargerBordereauPdf(dette.id, {
        dateCalcul,
        tauxPenalite,
        tauxInteretMensuel,
      });
    } catch (err) {
      alert('Erreur lors du téléchargement du bordereau : ' + extraireMessageErreur(err));
    } finally {
      setTelechargementEnCours(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col border border-gray-100">
        {/* En-tête officiel DGI */}
        <div className="bg-fiscal-bordeaux px-5 py-4 sm:px-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚖️</span>
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight">
                Liquidation des Pénalités & Intérêts de Retard
              </h2>
              <p className="text-[11px] sm:text-xs text-red-100 mt-0.5">
                Code Général des Impôts de Madagascar — Art. 20.01.53 & 20.01.54
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white rounded-lg p-1.5 text-lg font-bold transition-colors"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 flex-1 overflow-y-auto">
          {/* Identité de la créance */}
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-gray-500 block">Contribuable :</span>
              <strong className="text-gray-900 text-sm">{dette.nomContribuable}</strong>
            </div>
            <div>
              <span className="text-gray-500 block">Impôt & Période :</span>
              <strong className="text-gray-900">{dette.impot} ({dette.periodeFiscale})</strong>
            </div>
            <div>
              <span className="text-gray-500 block">Date d'échéance :</span>
              <strong className="text-red-700">{dette.dateEcheance}</strong>
            </div>
            <div>
              <span className="text-gray-500 block">Principal restant :</span>
              <strong className="text-fiscal-bordeaux text-sm">
                {(dette.montantDu - dette.montantPaye).toLocaleString('fr-FR')} Ar
              </strong>
            </div>
          </div>

          {/* Paramètres de liquidation interactifs */}
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                ⚙️ Paramètres légaux de liquidation
              </h3>
              <button
                type="button"
                onClick={() => void recalculerSimulation()}
                className="text-xs font-semibold text-blue-700 hover:underline"
              >
                🔄 Actualiser le calcul
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Date d'arrêté du décompte"
                type="date"
                value={dateCalcul}
                onChange={(e) => setDateCalcul(e.target.value)}
              />
              <Input
                label="Majoration de retard (CGI: 10%)"
                type="number"
                step="0.5"
                min={0}
                value={tauxPenalite}
                onChange={(e) => setTauxPenalite(Number(e.target.value))}
              />
              <Input
                label="Intérêt mensuel (CGI: 1%/mois)"
                type="number"
                step="0.1"
                min={0}
                value={tauxInteretMensuel}
                onChange={(e) => setTauxInteretMensuel(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Décompte détaillé */}
          {chargementCalcul ? (
            <div className="py-8 text-center text-sm text-gray-500">
              Calcul en cours selon les barèmes CGI...
            </div>
          ) : calcul ? (
            <div className="space-y-4">
              {/* Badge info retard */}
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⏱️</span>
                  <span>
                    Retard constaté : <strong>{calcul.joursRetard} jours</strong>, soit{' '}
                    <strong className="text-red-700 font-bold">{calcul.moisRetard} mois entamé(s)</strong> (règle CGI : tout mois commencé compte pour un mois plein).
                  </span>
                </div>
              </div>

              {/* Tableau de liquidation */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full text-xs divide-y divide-gray-200">
                  <thead className="bg-gray-50 font-bold text-gray-700">
                    <tr>
                      <th className="px-4 py-2.5 text-left">Poste de Décompte</th>
                      <th className="px-4 py-2.5 text-center">Taux / Base</th>
                      <th className="px-4 py-2.5 text-right">Montant Liquidation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    <tr>
                      <td className="px-4 py-2 text-gray-800">1. Principal de la créance fiscale</td>
                      <td className="px-4 py-2 text-center text-gray-500">Droits simples</td>
                      <td className="px-4 py-2 text-right font-semibold">
                        {calcul.montantPrincipal.toLocaleString('fr-FR')} Ar
                      </td>
                    </tr>
                    {calcul.montantDejaPaye > 0 && (
                      <tr className="text-green-700 bg-green-50/30">
                        <td className="px-4 py-2 italic">- Acomptes déjà acquittés</td>
                        <td className="px-4 py-2 text-center italic">Déduction</td>
                        <td className="px-4 py-2 text-right font-semibold">
                          - {calcul.montantDejaPaye.toLocaleString('fr-FR')} Ar
                        </td>
                      </tr>
                    )}
                    <tr className="bg-gray-50/60 font-semibold">
                      <td className="px-4 py-2 text-gray-900">Assiette de liquidation (Solde principal)</td>
                      <td className="px-4 py-2 text-center text-gray-600">Base de calcul</td>
                      <td className="px-4 py-2 text-right text-gray-900">
                        {calcul.soldePrincipalRestant.toLocaleString('fr-FR')} Ar
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-red-800">
                        2. Majoration pour retard (CGI Art. 20.01.53)
                      </td>
                      <td className="px-4 py-2 text-center font-mono text-gray-700">{calcul.tauxPenalite}%</td>
                      <td className="px-4 py-2 text-right font-bold text-red-700">
                        + {calcul.montantPenalite.toLocaleString('fr-FR')} Ar
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-orange-800">
                        3. Intérêts moratoires (CGI Art. 20.01.54)
                      </td>
                      <td className="px-4 py-2 text-center font-mono text-gray-700">
                        {calcul.tauxInteretMensuel}% x {calcul.moisRetard} mois ({calcul.tauxInteretMensuel * calcul.moisRetard}%)
                      </td>
                      <td className="px-4 py-2 text-right font-bold text-orange-700">
                        + {calcul.montantInterets.toLocaleString('fr-FR')} Ar
                      </td>
                    </tr>
                    {calcul.remiseGracieuse > 0 && (
                      <tr className="text-blue-800 bg-blue-50/50">
                        <td className="px-4 py-2">
                          4. Remise gracieuse administrative (DGI)
                          {calcul.motifRemise && <span className="block text-[11px] text-blue-600">Motif : {calcul.motifRemise}</span>}
                        </td>
                        <td className="px-4 py-2 text-center font-semibold text-blue-700">Dégrèvement</td>
                        <td className="px-4 py-2 text-right font-bold text-blue-700">
                          - {calcul.remiseGracieuse.toLocaleString('fr-FR')} Ar
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-fiscal-bordeaux/5 font-bold border-t-2 border-fiscal-bordeaux">
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        MONTANT TOTAL GLOBAL EXIGIBLE
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-gray-500">
                        Arrêté au {calcul.dateCalcul}
                      </td>
                      <td className="px-4 py-3 text-right text-base text-fiscal-bordeaux">
                        {calcul.totalExigible.toLocaleString('fr-FR')} Ar
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Formulaire de Remise Gracieuse (Dépliable) */}
              <div className="border border-dashed border-gray-300 rounded-lg p-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">
                    🎁 Procédure de Remise Gracieuse (Administration Fiscale)
                  </span>
                  <button
                    type="button"
                    onClick={() => setAfficherSectionRemise(!afficherSectionRemise)}
                    className="text-xs text-fiscal-bordeaux font-bold hover:underline"
                  >
                    {afficherSectionRemise ? 'Fermer le formulaire' : 'Accorder une remise'}
                  </button>
                </div>

                {afficherSectionRemise && (
                  <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
                    <p className="text-xs text-gray-500">
                      Conformément aux prérogatives de la Direction Générale des Impôts, une remise partielle ou totale
                      peut être accordée sur les pénalités et intérêts liquidés (plafond : {(calcul.montantPenalite + calcul.montantInterets).toLocaleString('fr-FR')} Ar).
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="Montant de la remise (Ar)"
                        type="number"
                        min={0}
                        max={calcul.montantPenalite + calcul.montantInterets}
                        value={montantRemise}
                        onChange={(e) => setMontantRemise(Number(e.target.value))}
                      />
                      <Input
                        label="Motif / Décision administrative"
                        value={motifRemise}
                        onChange={(e) => setMotifRemise(e.target.value)}
                        placeholder="ex: Difficulté économique avérée, décision DGI N° 458"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setMontantRemise(calcul.montantPenalite + calcul.montantInterets)}
                        className="px-2.5 py-1 text-[11px] font-medium rounded border border-blue-300 bg-white text-blue-700 hover:bg-blue-50"
                      >
                        Remise totale (100% pénalités)
                      </button>
                      <button
                        type="button"
                        onClick={() => setMontantRemise(Math.round((calcul.montantPenalite + calcul.montantInterets) / 2))}
                        className="px-2.5 py-1 text-[11px] font-medium rounded border border-blue-300 bg-white text-blue-700 hover:bg-blue-50"
                      >
                        Remise de 50%
                      </button>
                    </div>
                    <Button
                      onClick={() => void gererRemiseGracieuse()}
                      enCours={remiseEnCours}
                      className="text-xs"
                    >
                      ✓ Enregistrer la Remise Gracieuse
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {erreur && (
            <div className="rounded-md bg-red-50 p-3 text-xs text-red-700 border border-red-200">
              ⚠️ {erreur}
            </div>
          )}

          {messageSucces && (
            <div className="rounded-md bg-green-50 p-3 text-xs text-green-800 border border-green-200">
              ✅ {messageSucces}
            </div>
          )}
        </div>

        {/* Actions du pied de page */}
        <div className="bg-gray-100 px-6 py-3.5 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            type="button"
            variante="secondaire"
            onClick={() => void telechargerPdf()}
            enCours={telechargementEnCours}
            className="text-xs"
          >
            📄 Télécharger le Bordereau PDF Certifié
          </Button>

          <div className="flex gap-2 self-end sm:self-auto">
            <Button
              type="button"
              variante="secondaire"
              onClick={onClose}
              className="text-xs"
            >
              Fermer
            </Button>
            <Button
              type="button"
              onClick={() => void gererApplication()}
              enCours={applicationEnCours}
              className="text-xs font-bold"
            >
              ⚖️ Appliquer à la Créance Fiscale
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
