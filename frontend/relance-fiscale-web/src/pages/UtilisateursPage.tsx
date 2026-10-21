import { useEffect, useState } from 'react';
import { Table, type ColonneTable } from '@/components/common/Table';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { apiClient, extraireMessageErreur } from '@/services/apiClient';
import type { NomRole, Utilisateur, UtilisateurDTO } from '@/types/utilisateur.types';
import { ROLES_LIBELLES } from '@/utils/constants';

const TOUS_LES_ROLES: NomRole[] = ['ADMIN', 'RESPONSABLE_RECOUVREMENT', 'AGENT_RECOUVREMENT'];

export function UtilisateursPage() {
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [chargement, setChargement] = useState(true);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const [formulaire, setFormulaire] = useState<UtilisateurDTO>({
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
    telephone: '',
    roles: ['AGENT_RECOUVREMENT'],
  });

  async function charger() {
    setChargement(true);
    const { data } = await apiClient.get<Utilisateur[]>('/utilisateurs');
    setUtilisateurs(data);
    setChargement(false);
  }

  useEffect(() => {
    charger();
  }, []);

  async function gererCreation() {
    setErreur(null);
    setEnCours(true);
    try {
      await apiClient.post('/utilisateurs', formulaire);
      setModalOuverte(false);
      setFormulaire({ nom: '', prenom: '', email: '', motDePasse: '', telephone: '', roles: ['AGENT_RECOUVREMENT'] });
      await charger();
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setEnCours(false);
    }
  }

  async function gererActivation(utilisateur: Utilisateur) {
    await apiClient.patch(`/utilisateurs/${utilisateur.id}/statut`, null, { params: { actif: !utilisateur.actif } });
    await charger();
  }

  function basculerRole(role: NomRole) {
    setFormulaire((prev) => ({
      ...prev,
      roles: prev.roles.includes(role) ? prev.roles.filter((r) => r !== role) : [...prev.roles, role],
    }));
  }

  const colonnes: ColonneTable<Utilisateur>[] = [
    { cle: 'nom', entete: 'Nom complet', rendu: (u) => `${u.prenom ?? ''} ${u.nom}`.trim() },
    { cle: 'email', entete: 'Email', rendu: (u) => u.email },
    {
      cle: 'roles',
      entete: 'Rôles',
      rendu: (u) => (
        <div className="flex flex-wrap gap-1">
          {u.roles.map((r) => (
            <Badge key={r} couleur="bleu">{ROLES_LIBELLES[r] ?? r}</Badge>
          ))}
        </div>
      ),
    },
    {
      cle: 'statut',
      entete: 'Statut',
      rendu: (u) => <Badge couleur={u.actif ? 'vert' : 'gris'}>{u.actif ? 'Actif' : 'Désactivé'}</Badge>,
    },
    {
      cle: 'actions',
      entete: '',
      alignementDroite: true,
      rendu: (u) => (
        <Button variante="fantome" onClick={() => gererActivation(u)}>
          {u.actif ? 'Désactiver' : 'Activer'}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
        <Button onClick={() => setModalOuverte(true)}>+ Nouvel utilisateur</Button>
      </div>

      <Table colonnes={colonnes} donnees={utilisateurs} cleLigne={(u) => u.id} chargement={chargement} />

      <Modal
        ouverte={modalOuverte}
        titre="Nouvel utilisateur"
        onFermer={() => setModalOuverte(false)}
        pied={
          <>
            <Button variante="secondaire" onClick={() => setModalOuverte(false)}>Annuler</Button>
            <Button onClick={gererCreation} enCours={enCours}>Créer</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Nom" required value={formulaire.nom} onChange={(e) => setFormulaire({ ...formulaire, nom: e.target.value })} />
          <Input label="Prénom" value={formulaire.prenom} onChange={(e) => setFormulaire({ ...formulaire, prenom: e.target.value })} />
          <Input label="Email" type="email" required value={formulaire.email}
                 onChange={(e) => setFormulaire({ ...formulaire, email: e.target.value })} />
          <Input label="Mot de passe temporaire" type="password" required value={formulaire.motDePasse}
                 onChange={(e) => setFormulaire({ ...formulaire, motDePasse: e.target.value })} />
          <Input label="Téléphone" value={formulaire.telephone} onChange={(e) => setFormulaire({ ...formulaire, telephone: e.target.value })} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rôles</label>
            <div className="space-y-1">
              {TOUS_LES_ROLES.map((role) => (
                <label key={role} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={formulaire.roles.includes(role)} onChange={() => basculerRole(role)} />
                  {ROLES_LIBELLES[role]}
                </label>
              ))}
            </div>
          </div>

          {erreur && <p className="text-sm text-red-600">{erreur}</p>}
        </div>
      </Modal>
    </div>
  );
}