import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 text-center">
      <h1 className="text-4xl font-bold text-fiscal-bordeaux">404</h1>
      <p className="mt-2 text-gray-600">Page introuvable</p>
      <Link to="/dashboard" className="mt-4 text-sm text-fiscal-bordeaux hover:underline">
        Retour au tableau de bord
      </Link>
    </div>
  );
}