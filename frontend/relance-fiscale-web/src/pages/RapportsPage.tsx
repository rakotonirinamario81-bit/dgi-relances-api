import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { rapportService } from '@/services/rapportService';
import { extraireMessageErreur } from '@/services/apiClient';

export function RapportsPage() {
  const [telechargementEnCours, setTelechargementEnCours] = useState<string | null>(null);
  const [dateArreteGrandLivre, setDateArreteGrandLivre] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);

  async function executerTelechargement(cle: string, action: () => Promise<void>, messageSucces: string) {
    setErreur(null);
    setSucces(null);
    setTelechargementEnCours(cle);
    try {
      await action();
      setSucces(messageSucces);
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setTelechargementEnCours(null);
    }
  }

  return (
    <div className="max-w-5xl space-y-6">
      {/* En-tête de la page */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span>📊</span> Centre d'Exports & Rapports Fiscaux
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Exportations certifiées des données fiscales au format Excel (.xlsx), CSV normalisé et Grand Livre Comptable consolidé en PDF.
        </p>
      </div>

      {/* Bannière d'accès direct au Portail Public de Vérification & Quitus */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xl shadow shrink-0">
            🛡️
          </div>
          <div>
            <h2 className="text-sm font-bold text-emerald-950">
              Portail Public de Vérification & Quitus Fiscal (QR Code)
            </h2>
            <p className="text-xs text-emerald-800">
              Espace ouvert aux contribuables et tiers pour vérifier l'authenticité d'une quittance (QR Code) ou consulter la régularité d'un NIF et télécharger l'Attestation Fiscale officielle.
            </p>
          </div>
        </div>
        <Link
          to="/public/verifier-quittance"
          target="_blank"
          className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shrink-0 flex items-center gap-1.5 shadow"
        >
          <span>🔍</span> Ouvrir le Portail Public ↗
        </Link>
      </div>

      {/* Notifications feedback */}
      {erreur && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          ⚠️ {erreur}
        </div>
      )}
      {succes && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 border border-green-200 flex items-center justify-between">
          <span>✅ {succes}</span>
          <button onClick={() => setSucces(null)} className="text-green-600 hover:text-green-800 text-xs font-bold">
            Fermer
          </button>
        </div>
      )}

      {/* Grille des 3 modules d'exportation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* =================== CARTE 1 : GRAND LIVRE DES CRÉANCES =================== */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-xl text-blue-800">
              📑
            </div>
            <h2 className="text-base font-bold text-gray-900">
              Grand Livre des Créances Fiscales
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              Base complète de toutes les créances : NIF, droits simples, majorations de retard (10%), intérêts moratoires (1%/mois), remises gracieuses et solde exigible net.
            </p>
          </div>

          <div className="space-y-3 pt-3 border-t border-gray-100">
            {/* Grand Livre PDF */}
            <div className="rounded-lg bg-gray-50 p-3 border border-gray-200 space-y-2">
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                Arrêté des comptes (Grand Livre PDF)
              </label>
              <Input
                type="date"
                value={dateArreteGrandLivre}
                onChange={(e) => setDateArreteGrandLivre(e.target.value)}
              />
              <Button
                type="button"
                onClick={() =>
                  executerTelechargement(
                    'pdf_grand_livre',
                    () => rapportService.telechargerGrandLivrePdf(dateArreteGrandLivre),
                    'Grand Livre Comptable PDF généré avec succès !'
                  )
                }
                enCours={telechargementEnCours === 'pdf_grand_livre'}
                className="w-full text-xs font-bold"
              >
                📑 Grand Livre PDF Consolidé
              </Button>
            </div>

            {/* Excel & CSV */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variante="secondaire"
                onClick={() =>
                  executerTelechargement(
                    'excel_dettes',
                    () => rapportService.telechargerDettesExcel(),
                    'Export Excel des créances fiscales téléchargé avec succès !'
                  )
                }
                enCours={telechargementEnCours === 'excel_dettes'}
                className="text-xs w-full font-medium"
              >
                📥 Excel (.xlsx)
              </Button>
              <Button
                type="button"
                variante="secondaire"
                onClick={() =>
                  executerTelechargement(
                    'csv_dettes',
                    () => rapportService.telechargerDettesCsv(),
                    'Export CSV des créances fiscales téléchargé avec succès !'
                  )
                }
                enCours={telechargementEnCours === 'csv_dettes'}
                className="text-xs w-full font-medium"
              >
                📥 CSV (.csv)
              </Button>
            </div>
          </div>
        </div>

        {/* =================== CARTE 2 : JOURNAL DES ENCAISSEMENTS =================== */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-xl text-green-800">
              🧾
            </div>
            <h2 className="text-base font-bold text-gray-900">
              Journal des Encaissements & Quittances
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              Registre chronologique des paiements fiscaux pour le rapprochement comptable : n° de quittance officielle, date d'encaissement, mode de paiement, référence et montant en Ariary.
            </p>
          </div>

          <div className="space-y-3 pt-3 border-t border-gray-100">
            <div className="grid grid-cols-1 gap-2">
              <Button
                type="button"
                onClick={() =>
                  executerTelechargement(
                    'excel_paiements',
                    () => rapportService.telechargerPaiementsExcel(),
                    'Journal des encaissements Excel généré avec succès !'
                  )
                }
                enCours={telechargementEnCours === 'excel_paiements'}
                className="w-full text-xs font-semibold bg-green-700 hover:bg-green-800 text-white"
              >
                📥 Exporter le Journal en Excel (.xlsx)
              </Button>
              <Button
                type="button"
                variante="secondaire"
                onClick={() =>
                  executerTelechargement(
                    'csv_paiements',
                    () => rapportService.telechargerPaiementsCsv(),
                    'Journal des encaissements CSV téléchargé avec succès !'
                  )
                }
                enCours={telechargementEnCours === 'csv_paiements'}
                className="w-full text-xs font-medium"
              >
                📥 Exporter en CSV (Comptabilité publique)
              </Button>
            </div>
          </div>
        </div>

        {/* =================== CARTE 3 : REGISTRE DES MORATOIRES =================== */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-xl text-amber-800">
              📆
            </div>
            <h2 className="text-base font-bold text-gray-900">
              Registre des Moratoires & Échelonnements
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              Suivi consolidé de tous les accords de règlement échelonné : référence moratoire, nombre d'échéances accordées, mensualités, montant déjà recouvré, solde restant et statut (Actif/Soldé/Résilié).
            </p>
          </div>

          <div className="space-y-3 pt-3 border-t border-gray-100">
            <div className="grid grid-cols-1 gap-2">
              <Button
                type="button"
                onClick={() =>
                  executerTelechargement(
                    'excel_moratoires',
                    () => rapportService.telechargerMoratoiresExcel(),
                    'Registre des moratoires Excel téléchargé avec succès !'
                  )
                }
                enCours={telechargementEnCours === 'excel_moratoires'}
                className="w-full text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white"
              >
                📥 Exporter les Moratoires en Excel (.xlsx)
              </Button>
              <Button
                type="button"
                variante="secondaire"
                onClick={() =>
                  executerTelechargement(
                    'csv_moratoires',
                    () => rapportService.telechargerMoratoiresCsv(),
                    'Registre des moratoires CSV téléchargé avec succès !'
                  )
                }
                enCours={telechargementEnCours === 'csv_moratoires'}
                className="w-full text-xs font-medium"
              >
                📥 Exporter en CSV (.csv)
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bannière d'informations institutionnelles */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-2">
        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
          <span>🏛️</span> Normes de Déclaration & Rapprochement Comptable DGI
        </h3>
        <p className="text-xs text-gray-600 leading-relaxed">
          Les fichiers Excel et CSV exportés sont directement compatibles avec les systèmes de trésorerie de l'État malgache, les ERP comptables d'entreprise et les logiciels bureautiques courants (Microsoft Excel, LibreOffice Calc). Les montants sont exprimés en Ariary (MGA) et les dates au format standard ISO (AAAA-MM-JJ).
        </p>
      </div>
    </div>
  );
}