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
  const [canal] = useState<CanalNotification>('EMAIL');
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
        <div className="flex items-center gap-2 p-2.5 rounded border border-gray-300 bg-gray-50 text-xs font-semibold text-gray-700">
          <span>📧</span>
          <span>Courrier Électronique (Email) — Canal unique officiel</span>
        </div>
      </div>

      <Input label="Objet (e-mail)" value={objet} onChange={(e) => setObjet(e.target.value)} />

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
