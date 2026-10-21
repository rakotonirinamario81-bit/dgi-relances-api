import { Route } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { LoginPage } from '@/pages/LoginPage';
import { PublicVerificationPage } from '@/pages/PublicVerificationPage';
import { ROUTES } from './routesConfig';

export function PublicRoutes() {
  return (
    <>
      <Route element={<AuthLayout />}>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      </Route>
      <Route path={ROUTES.PUBLIC_VERIFICATION} element={<PublicVerificationPage />} />
      <Route path={ROUTES.PUBLIC_SITUATION} element={<PublicVerificationPage />} />
    </>
  );
}