import { Input } from '@/components/common/Input';
import type { ContribuableDTO } from '@/types/contribuable.types';

interface ContribuableFormProps {
  formulaire: ContribuableDTO;
  onChange: (formulaire: ContribuableDTO) => void;
  erreur?: string | null;
  nifLectureSeule?: boolean;
}

export function ContribuableForm({
  formulaire,
  onChange,
  erreur,
  nifLectureSeule = false,
}: ContribuableFormProps) {
  return (
    <div className="space-y-3">
      <Input
        label="NIF"
        required
        value={formulaire.nif}
        disabled={nifLectureSeule}
        onChange={(e) => onChange({ ...formulaire, nif: e.target.value })}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Type de contribuable</label>
        <select
          value={formulaire.typeContribuable}
          onChange={(e) =>
            onChange({
              ...formulaire,
              typeContribuable: e.target.value as ContribuableDTO['typeContribuable'],
            })
          }
          className="w-full rounded border border-gray-300 px-3 py-2"
        >
          <option value="PERSONNE_PHYSIQUE">Personne physique</option>
          <option value="PERSONNE_MORALE">Personne morale</option>
        </select>
      </div>

      <Input
        label="Nom / Raison sociale"
        required
        value={formulaire.nomOuRaisonSociale}
        onChange={(e) => onChange({ ...formulaire, nomOuRaisonSociale: e.target.value })}
      />
      <Input
        label="Commune"
        value={formulaire.commune ?? ''}
        onChange={(e) => onChange({ ...formulaire, commune: e.target.value })}
      />
      <Input
        label="Adresse"
        value={formulaire.adresse ?? ''}
        onChange={(e) => onChange({ ...formulaire, adresse: e.target.value })}
      />
      <Input
        label="Téléphone"
        value={formulaire.telephone ?? ''}
        onChange={(e) => onChange({ ...formulaire, telephone: e.target.value })}
      />
      <Input
        label="Email"
        type="email"
        value={formulaire.email ?? ''}
        onChange={(e) => onChange({ ...formulaire, email: e.target.value })}
      />

      {erreur && <p className="text-sm text-red-600">{erreur}</p>}
    </div>
  );
}

export const FORMULAIRE_CONTRIBUABLE_VIDE: ContribuableDTO = {
  nif: '',
  typeContribuable: 'PERSONNE_PHYSIQUE',
  nomOuRaisonSociale: '',
  adresse: '',
  commune: '',
  telephone: '',
  email: '',
};
