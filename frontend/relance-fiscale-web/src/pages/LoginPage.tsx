import { Link } from 'react-router-dom';
import { LoginForm } from '@/auth/LoginForm';

export function LoginPage() {
  return (
    <div className="flex flex-col items-center space-y-4">
      <LoginForm />
      <div className="pt-4 border-t border-gray-200 w-full max-w-sm text-center">
        <Link
          to="/public/verifier-quittance"
          className="text-xs font-semibold text-fiscal-bordeaux hover:underline flex items-center justify-center gap-1.5"
        >
          <span>🔍</span> Portail public de vérification fiscale & Quitus (sans login)
        </Link>
      </div>
    </div>
  );
}