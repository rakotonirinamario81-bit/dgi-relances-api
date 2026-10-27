import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { publicPortailService } from '@/services/publicPortailService';
import { extraireMessageErreur } from '@/services/apiClient';
import type { QuittanceVerificationDTO, SituationFiscalePubliqueDTO } from '@/types/publicPortail.types';

export function PublicVerificationPage() {
  const [searchParams] = useSearchParams();
  const refParam = searchParams.get('ref') || '';
  const nifParam = searchParams.get('nif') || '';

  const [onglet, setOnglet] = useState<'QUITTANCE' | 'SITUATION'>(() => {
    if (nifParam && !refParam) return 'SITUATION';
    return 'QUITTANCE';
  });

  // Mode Quittance
  const [referenceRecherche, setReferenceRecherche] = useState(refParam);
  const [quittance, setQuittance] = useState<QuittanceVerificationDTO | null>(null);
  const [chargementQuittance, setChargementQuittance] = useState(false);
  const [erreurQuittance, setErreurQuittance] = useState<string | null>(null);

  // Mode Situation fiscale (NIF)
  const [nifRecherche, setNifRecherche] = useState(nifParam);
  const [situation, setSituation] = useState<SituationFiscalePubliqueDTO | null>(null);
  const [chargementSituation, setChargementSituation] = useState(false);
  const [erreurSituation, setErreurSituation] = useState<string | null>(null);
  const [telechargementPdfEnCours, setTelechargementPdfEnCours] = useState(false);

  async function verifierQuittance(ref: string) {
    if (!ref.trim()) return;
    setChargementQuittance(true);
    setErreurQuittance(null);
    setQuittance(null);
    try {
      const data = await publicPortailService.verifierQuittance(ref.trim());
      setQuittance(data);
    } catch (err) {
      setErreurQuittance(extraireMessageErreur(err));
    } finally {
      setChargementQuittance(false);
    }
  }

  async function consulterSituation(nif: string) {
    if (!nif.trim()) return;
    setChargementSituation(true);
    setErreurSituation(null);
    setSituation(null);
    try {
      const data = await publicPortailService.consulterSituation(nif.trim());
      setSituation(data);
    } catch (err) {
      setErreurSituation(extraireMessageErreur(err));
    } finally {
      setChargementSituation(false);
    }
  }

  // Déclenchement automatique si paramètres d'URL (ex: suite à un scan de QR Code)
  useEffect(() => {
    if (refParam) {
      setReferenceRecherche(refParam);
      setOnglet('QUITTANCE');
      void verifierQuittance(refParam);
    } else if (nifParam) {
      setNifRecherche(nifParam);
      setOnglet('SITUATION');
      void consulterSituation(nifParam);
    }
  }, [refParam, nifParam]);

  async function telechargerAttestation() {
    if (!situation) return;
    setTelechargementPdfEnCours(true);
    try {
      await publicPortailService.telechargerAttestationPdf(situation.nif);
    } catch (err) {
      alert("Erreur lors de l'obtention de l'attestation : " + extraireMessageErreur(err));
    } finally {
      setTelechargementPdfEnCours(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Barre supérieure officielle */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-fiscal-bordeaux text-white flex items-center justify-center font-bold text-lg shadow">
              🇲🇬
            </div>
            <div>
              <div className="text-[10px] font-bold tracking-wider text-fiscal-bordeaux uppercase">
                DIRECTION REGIONALE DES IMPOTS - VATOVAVY FITOVINANY
              </div>
              <h1 className="text-sm font-bold text-gray-900 sm:text-base">
                Portail Public de Vérification Fiscale
              </h1>
            </div>
          </div>
          <Link
            to="/login"
            className="text-xs font-semibold text-gray-600 hover:text-fiscal-bordeaux transition-colors px-3 py-1.5 rounded-lg border border-gray-200 hover:border-fiscal-bordeaux"
          >
            🔐 Espace Agent
          </Link>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-3xl w-full mx-auto px-4 py-8 space-y-6">
        {/* Bandeau d'accueil */}
        <div className="text-center space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span>🛡️</span> Service Public Certifié & Ouvert
          </span>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight sm:text-3xl">
            Vérifiez vos documents fiscaux en temps réel
          </h2>
          <p className="text-xs text-gray-500 max-w-lg mx-auto">
            Scannez le QR Code de votre quittance ou saisissez votre Numéro d'Identification Fiscale (NIF) pour attester de la régularité fiscale.
          </p>
        </div>

        {/* Sélecteur d'onglets */}
        <div className="flex rounded-xl bg-gray-200/80 p-1 text-xs font-bold">
          <button
            onClick={() => setOnglet('QUITTANCE')}
            className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 ${
              onglet === 'QUITTANCE'
                ? 'bg-white text-fiscal-bordeaux shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>🧾</span> Vérifier une Quittance
          </button>
          <button
            onClick={() => setOnglet('SITUATION')}
            className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 ${
              onglet === 'SITUATION'
                ? 'bg-white text-fiscal-bordeaux shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>🏛️</span> Situation Fiscale / Quitus (NIF)
          </button>
        </div>

        {/* ===================== ONGLET 1 : QUITTANCE ===================== */}
        {onglet === 'QUITTANCE' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Numéro ou Référence de la quittance
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="ex: QUIT-2026-00001 ou 1"
                  value={referenceRecherche}
                  onChange={(e) => setReferenceRecherche(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={() => void verifierQuittance(referenceRecherche)}
                  enCours={chargementQuittance}
                  className="font-bold text-xs shrink-0"
                >
                  🔍 Vérifier
                </Button>
              </div>
              <p className="text-[11px] text-gray-400">
                La référence figure sous le code-barres ou dans le titre du reçu de paiement officiel délivré par la DGI.
              </p>
            </div>

            {erreurQuittance && (
              <div className="rounded-xl bg-red-50 p-4 border border-red-200 text-xs text-red-700 space-y-1">
                <div className="font-bold text-sm">❌ Document non reconnu</div>
                <div>{erreurQuittance}</div>
              </div>
            )}

            {quittance && (
              <div className="rounded-2xl border-2 border-emerald-500 bg-white shadow-lg overflow-hidden space-y-0">
                {/* Bandeau de certification */}
                <div className="bg-emerald-600 text-white p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🛡️</span>
                    <div>
                      <div className="font-bold text-base">DOCUMENT OFFICIEL AUTHENTIFIÉ</div>
                      <div className="text-xs text-emerald-100">{quittance.statutAuthenticite}</div>
                    </div>
                  </div>
                  <span className="bg-white/20 text-white text-[11px] px-2.5 py-1 rounded-full font-bold">
                    ✓ VALIDE
                  </span>
                </div>

                {/* Détails du paiement */}
                <div className="p-6 space-y-4">
                  <div className="text-center py-2 bg-emerald-50/60 rounded-xl border border-emerald-100">
                    <div className="text-xs text-emerald-800 font-medium">Montant officiellement acquitté</div>
                    <div className="text-2xl font-black text-emerald-900 mt-0.5">
                      {quittance.montant.toLocaleString('fr-FR')} <span className="text-sm font-bold">Ariary (MGA)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-500 block">N° Quittance :</span>
                      <strong className="text-gray-900 font-mono text-sm">{quittance.numeroQuittance}</strong>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-500 block">Date du versement :</span>
                      <strong className="text-gray-900">{quittance.datePaiement}</strong>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-500 block">Contribuable :</span>
                      <strong className="text-gray-900">{quittance.nomContribuable}</strong>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-500 block">NIF (Identifiant protégé) :</span>
                      <strong className="text-gray-900 font-mono">{quittance.nifMasque}</strong>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-500 block">Nature de l'impôt :</span>
                      <strong className="text-gray-900">{quittance.impot}</strong>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-500 block">Période fiscale :</span>
                      <strong className="text-gray-900">{quittance.periodeFiscale}</strong>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-500 block">Mode de paiement :</span>
                      <strong className="text-gray-900">{quittance.modePaiement}</strong>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-500 block">Centre de rattachement :</span>
                      <strong className="text-gray-900">{quittance.commune}</strong>
                    </div>
                  </div>

                  <div className="text-[11px] text-gray-400 text-center pt-2 border-t border-gray-100">
                    Vérification certifiée par horodatage électronique le {quittance.dateVerification}.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== ONGLET 2 : SITUATION (NIF) ===================== */}
        {onglet === 'SITUATION' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Numéro d'Identification Fiscale (NIF)
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="ex: 1002345678"
                  value={nifRecherche}
                  onChange={(e) => setNifRecherche(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={() => void consulterSituation(nifRecherche)}
                  enCours={chargementSituation}
                  className="font-bold text-xs shrink-0"
                >
                  🔍 Consulter
                </Button>
              </div>
              <p className="text-[11px] text-gray-400">
                Saisissez les 10 chiffres de votre Numéro d'Identification Fiscale (NIF) pour générer l'état de votre situation fiscale.
              </p>
            </div>

            {erreurSituation && (
              <div className="rounded-xl bg-red-50 p-4 border border-red-200 text-xs text-red-700 space-y-1">
                <div className="font-bold text-sm">❌ Contribuable introuvable</div>
                <div>{erreurSituation}</div>
              </div>
            )}

            {situation && (
              <div className="rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden space-y-0">
                {/* En-tête statut */}
                <div
                  className={`p-5 text-white flex items-center justify-between ${
                    situation.estEnRegle ? 'bg-emerald-700' : 'bg-amber-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{situation.estEnRegle ? '✅' : '⚠️'}</span>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                        État de situation fiscale
                      </div>
                      <h3 className="font-black text-lg">{situation.statutFiscal}</h3>
                    </div>
                  </div>
                  <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-bold">
                    {situation.codeAttestation}
                  </span>
                </div>

                {/* Détails */}
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-500 block">Raison Sociale / Nom :</span>
                      <strong className="text-gray-900 text-sm">{situation.nomContribuable}</strong>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-500 block">NIF :</span>
                      <strong className="text-gray-900 font-mono text-sm">{situation.nif}</strong>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-500 block">Centre de gestion :</span>
                      <strong className="text-gray-900">{situation.commune}</strong>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-500 block">Date d'arrêté :</span>
                      <strong className="text-gray-900">{situation.dateDelivrance}</strong>
                    </div>
                  </div>

                  {/* Compteurs */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-green-50 border border-green-200">
                      <div className="text-xl font-black text-green-700">{situation.nombreDettesSoldees}</div>
                      <div className="text-[10px] text-green-800 font-medium mt-0.5">Dossiers soldés</div>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                      <div className="text-xl font-black text-amber-700">{situation.nombreDettesEnCours}</div>
                      <div className="text-[10px] text-amber-800 font-medium mt-0.5">Dossiers en cours</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-base font-black text-slate-800">
                        {situation.soldeRestantGlobal.toLocaleString('fr-FR')} Ar
                      </div>
                      <div className="text-[10px] text-slate-600 font-medium mt-0.5">Reste dû</div>
                    </div>
                  </div>

                  {/* Bouton de téléchargement de l'Attestation Officielle avec QR Code */}
                  <div className="pt-2">
                    <Button
                      onClick={() => void telechargerAttestation()}
                      enCours={telechargementPdfEnCours}
                      className="w-full py-3 text-xs font-bold flex items-center justify-center gap-2"
                    >
                      <span>📄</span> Télécharger l'Attestation Officielle (PDF avec QR Code)
                    </Button>
                    <p className="text-[11px] text-gray-400 text-center mt-2">
                      Document certifié pour marchés publics, banques et formalités administratives.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Pied de page officiel */}
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-500 space-y-1">
        <p className="font-semibold text-gray-700">DIRECTION REGIONALE DES IMPOTS - VATOVAVY FITOVINANY — République de Madagascar</p>
        <p className="text-[11px]">Plateforme Sécurisée de Dématérialisation et de Vérification des Titres Fiscaux</p>
      </footer>
    </div>
  );
}
