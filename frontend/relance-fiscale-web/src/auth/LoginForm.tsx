import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';
import { extraireMessageErreur } from '@/services/apiClient';

export function LoginForm() {
  const { login } = useAuthContext();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function gererSoumission(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await login({ email, motDePasse });
      navigate('/dashboard');
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={gererSoumission} className="w-full max-w-sm space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Adresse e-mail</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-fiscal-bordeaux"
          placeholder="agent@service-fiscal.gov.mg"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
        <input
          type="password"
          required
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-fiscal-bordeaux"
        />
      </div>

      {erreur && <p className="text-sm text-red-600">{erreur}</p>}

      <button
        type="submit"
        disabled={enCours}
        className="w-full rounded bg-fiscal-bordeaux text-white py-2 font-medium hover:bg-fiscal-bordeauxFonce disabled:opacity-50"
      >
        {enCours ? 'Connexion en cours...' : 'Se connecter'}
      </button>
    </form>
  );
}