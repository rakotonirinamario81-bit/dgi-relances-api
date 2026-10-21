import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { contribuableService } from '@/services/contribuableService';
import { useDettesFiscales } from '@/hooks/useDettesFiscales';
import { Loader } from '@/components/common/Loader';
import { DetteFiscaleTable } from '@/components/metier/DetteFiscaleTable';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import {
  ContribuableForm,
  FORMULAIRE_CONTRIBUABLE_VIDE,
} from '@/components/metier/ContribuableForm';
import type { Contribuable, ContribuableDTO } from '@/types/contribuable.types';
import { extraireMessageErreur } from '@/services/apiClient';
import { formaterMontant } from '@/utils/formatDate';

export function ContribuableDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const contribuableId = id ? Number(id) : null;

  const [contribuable, setContribuable] = useState<Contribuable | null>(null);
  const [chargementContribuable, setChargementContribuable] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const [modeModal, setModeModal] = useState<'modification' | 'suppression' | null>(null);
  const [formulaire, setFormulaire] = useState<ContribuableDTO>(FORMULAIRE_CONTRIBUABLE_VIDE);
  const [erreurFormulaire, setErreurFormulaire] = useState<string | null>(null);
  const [enregistrementEnCours, setEnregistrementEnCours] = useState(false);

  const { dettes, chargement: chargementDettes } = useDettesFiscales(contribuableId);

  async function chargerContribuable() {
    if (contribuableId === null) return;
    setChargementContribuable(true);
    try {
      const data = await contribuableService.obtenirParId(contribuableId);
      setContribuable(data);
      setErreur(null);
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setChargementContribuable(false);
    }
  }

  useEffect(() => {
    void chargerContribuable();
  }, [contribuableId]);

  function ouvrirModification() {
    if (!contribuable) return;
    setFormulaire({
      nif: contribuable.nif,
      typeContribuable: contribuable.typeContribuable,
      nomOuRaisonSociale: contribuable.nomOuRaisonSociale || contribuable.nomAffichage,
      adresse: contribuable.adresse ?? '',
      commune: contribuable.commune ?? '',
      telephone: contribuable.telephone ?? '',
      email: contribuable.email ?? '',
    });
    setErreurFormulaire(null);
    setModeModal('modification');
  }

  async function gererModification() {
    if (!contribuable) return;
    setErreurFormulaire(null);
    setEnregistrementEnCours(true);
    try {
      const misAJour = await contribuableService.modifier(contribuable.id, formulaire);
      setContribuable(misAJour);
      setModeModal(null);
    } catch (err) {
      setErreurFormulaire(extraireMessageErreur(err));
    } finally {
      setEnregistrementEnCours(false);
    }
  }

  async function gererSuppression() {
    if (!contribuable) return;
    setErreurFormulaire(null);
    setEnregistrementEnCours(true);
    try {
      await contribuableService.supprimer(contribuable.id);
      navigate('/contribuables');
    } catch (err) {
      setErreurFormulaire(extraireMessageErreur(err));
    } finally {
      setEnregistrementEnCours(false);
    }
  }

  if (chargementContribuable) return <Loader />;
  if (erreur) return <p className="text-sm text-red-600">{erreur}</p>;
  if (!contribuable) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{contribuable.nomAffichage}</h1>
          <p className="text-sm text-gray-500">NIF : {contribuable.nif}</p>
          <button
            type="button"
            onClick={() => navigate('/contribuables')}
            className="mt-1 text-sm text-fiscal-bordeaux hover:underline"
          >
            ← Retour à la liste
          </button>
        </div>
        <div className="flex gap-2">
          <Button variante="secondaire" onClick={ouvrirModification}>
            Modifier
          </Button>
          <Button variante="danger" onClick={() => setModeModal('suppression')}>
            Supprimer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs sm:grid-cols-2 lg:grid-cols-5">
        <InfoLigne
          libelle="Type"
          valeur={
            contribuable.typeContribuable === 'PERSONNE_MORALE'
              ? '🏢 Personne morale'
              : '👤 Personne physique'
          }
        />
        <InfoLigne libelle="Commune" valeur={contribuable.commune ?? '-'} />
        <InfoLigne libelle="Téléphone" valeur={contribuable.telephone ?? '-'} />
        <InfoLigne libelle="Email" valeur={contribuable.email ?? '-'} />
        <InfoLigne libelle="Adresse" valeur={contribuable.adresse ?? '-'} />
      </div>

      {/* Section Dettes Fiscales */}
      <div className="rounded-2xl border border-gray-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>📜</span> Portefeuille des Dettes Fiscales
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Historique des titres d'imposition et états de recouvrement pour ce contribuable
            </p>
          </div>
          <span className="self-start sm:self-auto rounded-full bg-fiscal-bordeaux/10 text-fiscal-bordeaux px-3 py-1 text-xs font-bold font-mono">
            {dettes.length} titre(s)
          </span>
        </div>

        {/* Mini KPI Contribuable */}
        {dettes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Émis</span>
              <p className="text-base font-extrabold text-slate-900 font-mono mt-0.5">
                {formaterMontant(dettes.reduce((sum, d) => sum + (d.montantDu || 0), 0))}
              </p>
            </div>
            <div className="rounded-xl bg-red-50/70 border border-red-200 p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 block">Solde Restant Dû</span>
              <p className="text-base font-extrabold text-red-700 font-mono mt-0.5">
                {formaterMontant(dettes.reduce((sum, d) => sum + (d.soldeRestant || 0), 0))}
              </p>
            </div>
            <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">Dettes en Retard</span>
              <p className="text-base font-extrabold text-amber-800 font-mono mt-0.5">
                {dettes.filter((d) => d.joursDeRetard > 0 && d.statut !== 'PAYE' && d.statut !== 'CLOTURE').length} dossier(s)
              </p>
            </div>
          </div>
        )}

        <DetteFiscaleTable dettes={dettes} chargement={chargementDettes} />
      </div>

      <Modal
        ouverte={modeModal === 'modification'}
        titre="Modifier le contribuable"
        onFermer={() => setModeModal(null)}
        pied={
          <>
            <Button variante="secondaire" onClick={() => setModeModal(null)}>
              Annuler
            </Button>
            <Button onClick={gererModification} enCours={enregistrementEnCours}>
              Enregistrer
            </Button>
          </>
        }
      >
        <ContribuableForm
          formulaire={formulaire}
          onChange={setFormulaire}
          erreur={erreurFormulaire}
          nifLectureSeule
        />
      </Modal>

      <Modal
        ouverte={modeModal === 'suppression'}
        titre="Supprimer le contribuable"
        onFermer={() => setModeModal(null)}
        pied={
          <>
            <Button variante="secondaire" onClick={() => setModeModal(null)}>
              Annuler
            </Button>
            <Button variante="danger" onClick={gererSuppression} enCours={enregistrementEnCours}>
              Confirmer la suppression
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-700">
          Voulez-vous vraiment supprimer{' '}
          <span className="font-medium">{contribuable.nomAffichage}</span> ? Cette action est
          irréversible.
        </p>
        {erreurFormulaire && <p className="mt-3 text-sm text-red-600">{erreurFormulaire}</p>}
      </Modal>
    </div>
  );
}

function InfoLigne({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <div>
      <p className="text-xs uppercase text-gray-400">{libelle}</p>
      <p className="text-sm text-gray-900">{valeur}</p>
    </div>
  );
}
