import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContribuables } from '@/hooks/useContribuables';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import { SearchBar } from '@/components/common/SearchBar';
import { Pagination } from '@/components/common/Pagination';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { ContribuableCard } from '@/components/metier/ContribuableCard';
import {
  ContribuableForm,
  FORMULAIRE_CONTRIBUABLE_VIDE,
} from '@/components/metier/ContribuableForm';
import { Loader } from '@/components/common/Loader';
import { contribuableService } from '@/services/contribuableService';
import { extraireMessageErreur } from '@/services/apiClient';
import type { Contribuable, ContribuableDTO } from '@/types/contribuable.types';

type ModeModal = 'creation' | 'modification' | 'suppression' | null;

export function ContribuablesListPage() {
  const navigate = useNavigate();
  const [recherche, setRecherche] = useState('');
  const rechercheDebattue = useDebounce(recherche);
  const { page, taillePage, allerALaPage } = usePagination();

  const { contribuables, totalElements, chargement, erreur, recharger } = useContribuables({
    nom: rechercheDebattue,
    page,
    taillePage,
  });

  const [modeModal, setModeModal] = useState<ModeModal>(null);
  const [contribuableCible, setContribuableCible] = useState<Contribuable | null>(null);
  const [formulaire, setFormulaire] = useState<ContribuableDTO>(FORMULAIRE_CONTRIBUABLE_VIDE);
  const [erreurFormulaire, setErreurFormulaire] = useState<string | null>(null);
  const [enregistrementEnCours, setEnregistrementEnCours] = useState(false);

  function ouvrirCreation() {
    setContribuableCible(null);
    setFormulaire(FORMULAIRE_CONTRIBUABLE_VIDE);
    setErreurFormulaire(null);
    setModeModal('creation');
  }

  function ouvrirModification(contribuable: Contribuable) {
    setContribuableCible(contribuable);
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

  function ouvrirSuppression(contribuable: Contribuable) {
    setContribuableCible(contribuable);
    setErreurFormulaire(null);
    setModeModal('suppression');
  }

  function fermerModal() {
    setModeModal(null);
    setContribuableCible(null);
    setErreurFormulaire(null);
  }

  async function gererCreation() {
    setErreurFormulaire(null);
    setEnregistrementEnCours(true);
    try {
      const cree = await contribuableService.creer(formulaire);
      fermerModal();
      await recharger();
      navigate(`/contribuables/${cree.id}`);
    } catch (err) {
      setErreurFormulaire(extraireMessageErreur(err));
    } finally {
      setEnregistrementEnCours(false);
    }
  }

  async function gererModification() {
    if (!contribuableCible) return;
    setErreurFormulaire(null);
    setEnregistrementEnCours(true);
    try {
      await contribuableService.modifier(contribuableCible.id, formulaire);
      fermerModal();
      await recharger();
    } catch (err) {
      setErreurFormulaire(extraireMessageErreur(err));
    } finally {
      setEnregistrementEnCours(false);
    }
  }

  async function gererSuppression() {
    if (!contribuableCible) return;
    setErreurFormulaire(null);
    setEnregistrementEnCours(true);
    try {
      await contribuableService.supprimer(contribuableCible.id);
      fermerModal();
      await recharger();
    } catch (err) {
      setErreurFormulaire(extraireMessageErreur(err));
    } finally {
      setEnregistrementEnCours(false);
    }
  }

  const totalPages = Math.ceil(totalElements / taillePage);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Contribuables</h1>
        <Button onClick={ouvrirCreation}>+ Nouveau contribuable</Button>
      </div>

      <div className="mb-4">
        <SearchBar valeur={recherche} onChange={setRecherche} placeholder="Rechercher par nom ou NIF..." />
      </div>

      {erreur && <p className="mb-4 text-sm text-red-600">{erreur}</p>}

      {chargement ? (
        <Loader />
      ) : contribuables.length === 0 ? (
        <p className="text-sm text-gray-500">Aucun contribuable trouvé.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {contribuables.map((c) => (
            <ContribuableCard
              key={c.id}
              contribuable={c}
              onModifier={ouvrirModification}
              onSupprimer={ouvrirSuppression}
            />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChanger={allerALaPage} />

      <Modal
        ouverte={modeModal === 'creation' || modeModal === 'modification'}
        titre={modeModal === 'modification' ? 'Modifier le contribuable' : 'Nouveau contribuable'}
        onFermer={fermerModal}
        pied={
          <>
            <Button variante="secondaire" onClick={fermerModal}>
              Annuler
            </Button>
            <Button
              onClick={modeModal === 'modification' ? gererModification : gererCreation}
              enCours={enregistrementEnCours}
            >
              {modeModal === 'modification' ? 'Enregistrer' : 'Créer'}
            </Button>
          </>
        }
      >
        <ContribuableForm
          formulaire={formulaire}
          onChange={setFormulaire}
          erreur={erreurFormulaire}
          nifLectureSeule={modeModal === 'modification'}
        />
      </Modal>

      <Modal
        ouverte={modeModal === 'suppression'}
        titre="Supprimer le contribuable"
        onFermer={fermerModal}
        pied={
          <>
            <Button variante="secondaire" onClick={fermerModal}>
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
          <span className="font-medium">{contribuableCible?.nomAffichage}</span> (NIF:{' '}
          {contribuableCible?.nif}) ? Cette action est irréversible.
        </p>
        {erreurFormulaire && <p className="mt-3 text-sm text-red-600">{erreurFormulaire}</p>}
      </Modal>
    </div>
  );
}
