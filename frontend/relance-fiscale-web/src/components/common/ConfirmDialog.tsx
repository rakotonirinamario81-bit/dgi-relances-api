import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  ouverte: boolean;
  titre: string;
  message: string;
  onConfirmer: () => void;
  onAnnuler: () => void;
  enCours?: boolean;
  erreur?: string | null;
}

export function ConfirmDialog({ ouverte, titre, message, onConfirmer, onAnnuler, enCours, erreur }: ConfirmDialogProps) {
  return (
    <Modal
      ouverte={ouverte}
      titre={titre}
      onFermer={onAnnuler}
      pied={
        <>
          <Button variante="secondaire" onClick={onAnnuler} disabled={enCours}>
            Annuler
          </Button>
          <Button variante="danger" onClick={onConfirmer} enCours={enCours}>
            Confirmer
          </Button>
        </>
      }
    >
      <p className="text-sm text-gray-700">{message}</p>
      {erreur && <p className="mt-2 text-sm text-red-600">{erreur}</p>}
    </Modal>
  );
}