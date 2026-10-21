import { useState, type FormEvent } from 'react';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import type { CanalNotification, ModeleMessageDTO } from '@/types/modeleMessage.types';

const VARIABLES_DISPONIBLES = ['nom', 'nif', 'montant', 'date', 'impot', 'periode', 'jours_retard'];

interface ModeleMessageEditorProps {
  onSoumettre: (dto: ModeleMessageDTO) => Promise<void>;
  enCours?: boolean;
}

export function ModeleMessageEditor({ onSoumettre, enCours }: ModeleMessageEditorProps) {
  const [nom, setNom] = useState('');
  const [canal, setCanal] = useState<CanalNotification>('SMS');
  const [objet, setObjet] = useState('');
  const [contenu, setContenu] = useState('');

  async function gererSoumission(e: FormEvent) {
    e.preventDefault();
    await onSoumettre({ nom, canal, objet: objet || undefined, contenu });
  }

  function inserer(variable: string) {
    setContenu((prev) => `${prev}{${variable}}`);
  }

  return (
    <form onSubmit={gererSoumission} className="space-y-4">
      <Input label="Nom du modèle" required value={nom} onChange={(e) => setNom(e.target.value)} />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Canal</label>
        <select value={canal} onChange={(e) => setCanal(e.target.value as CanalNotification)}
                className="w-full rounded border border-gray-300 px-3 py-2">
          <option value="SMS">SMS</option>
          <option value="EMAIL">Email</option>
          <option value="SMS_ET_EMAIL">SMS + Email</option>
        </select>
      </div>

      {canal !== 'SMS' && (
        <Input label="Objet (e-mail)" value={objet} onChange={(e) => setObjet(e.target.value)} />
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Contenu du message</label>
        <textarea
          required
          rows={5}
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2"
          placeholder="Bonjour {nom}, votre paiement de {montant} est échu le {date}."
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {VARIABLES_DISPONIBLES.map((v) => (
            <button
              type="button"
              key={v}
              onClick={() => inserer(v)}
              className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
            >
              {`{${v}}`}
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" enCours={enCours}>Enregistrer le modèle</Button>
    </form>
  );
}