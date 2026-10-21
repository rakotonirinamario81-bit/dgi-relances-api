import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { LoginPage } from '@/pages/LoginPage';
import { PublicVerificationPage } from '@/pages/PublicVerificationPage';
import { PrivateRoutes } from './PrivateRoutes';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ROUTES } from './routesConfig';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />

        {/* Routes publiques */}
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        </Route>
        <Route path={ROUTES.PUBLIC_VERIFICATION} element={<PublicVerificationPage />} />
        <Route path={ROUTES.PUBLIC_SITUATION} element={<PublicVerificationPage />} />

        {PrivateRoutes()}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}