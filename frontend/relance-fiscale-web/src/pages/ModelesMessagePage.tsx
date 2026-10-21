import { useEffect, useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { ModeleMessageEditor } from '@/components/metier/ModeleMessageEditor';
import { Badge } from '@/components/common/Badge';
import { modeleMessageService } from '@/services/modeleMessageService';
import { extraireMessageErreur } from '@/services/apiClient';
import type { CanalNotification, ModeleMessage, ModeleMessageDTO } from '@/types/modeleMessage.types';

const CANAUX: CanalNotification[] = ['SMS', 'EMAIL', 'SMS_ET_EMAIL'];

export function ModelesMessagePage() {
  const [canalActif, setCanalActif] = useState<CanalNotification>('SMS');
  const [modeles, setModeles] = useState<ModeleMessage[]>([]);
  const [chargement, setChargement] = useState(true);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function charger() {
    setChargement(true);
    try {
      setModeles(await modeleMessageService.listerParCanal(canalActif));
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canalActif]);

  async function gererCreation(dto: ModeleMessageDTO) {
    setErreur(null);
    setEnCours(true);
    try {
      await modeleMessageService.creer(dto);
      setModalOuverte(false);
      await charger();
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Modèles de message</h1>
        <Button onClick={() => setModalOuverte(true)}>+ Nouveau modèle</Button>
      </div>

      <div className="mb-4 flex gap-2">
        {CANAUX.map((canal) => (
          <button
            key={canal}
            onClick={() => setCanalActif(canal)}
            className={`rounded px-3 py-1.5 text-sm ${
              canalActif === canal ? 'bg-fiscal-bordeaux text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {canal.replace('_', ' ')}
          </button>
        ))}
      </div>

      {chargement ? (
        <p className="text-sm text-gray-400">Chargement...</p>
      ) : modeles.length === 0 ? (
        <p className="text-sm text-gray-400">Aucun modèle pour ce canal.</p>
      ) : (
        <div className="space-y-3">
          {modeles.map((modele) => (
            <div key={modele.id} className="rounded border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">{modele.nom}</h3>
                {modele.niveauRelanceAssocie && <Badge couleur="bleu">{modele.niveauRelanceAssocie}</Badge>}
              </div>
              {modele.objet && <p className="mt-1 text-sm text-gray-500">Objet : {modele.objet}</p>}
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{modele.contenu}</p>
            </div>
          ))}
        </div>
      )}

      <Modal ouverte={modalOuverte} titre="Nouveau modèle de message" onFermer={() => setModalOuverte(false)}>
        <ModeleMessageEditor onSoumettre={gererCreation} enCours={enCours} />
        {erreur && <p className="mt-2 text-sm text-red-600">{erreur}</p>}
      </Modal>
    </div>
  );
}