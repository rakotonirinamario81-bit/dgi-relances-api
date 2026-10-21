import { Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/auth/ProtectedRoute';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ROUTES } from './routesConfig';

import { DashboardPage } from '@/pages/DashboardPage';
import { ContribuablesListPage } from '@/pages/ContribuablesListPage';
import { ContribuableDetailPage } from '@/pages/ContribuableDetailPage';
import { DettesFiscalesPage } from '@/pages/DettesFiscalesPage';
import { PaiementsPage } from '@/pages/PaiementsPage';
import { RelancesPage } from '@/pages/RelancesPage';
import { CalendrierFiscalPage } from '@/pages/CalendrierFiscalPage';
import { EcheancesFiscalesPage } from '@/pages/EcheancesFiscalesPage';
import { CampagnesRelancePage } from '@/pages/CampagnesRelancePage';
import { ModelesMessagePage } from '@/pages/ModelesMessagePage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { StatistiquesPage } from '@/pages/StatistiquesPage';
import { RapportsPage } from '@/pages/RapportsPage';
import { ScoringRisquePage } from '@/pages/ScoringRisquePage';
import { CartographiePage } from '@/pages/CartographiePage';
import { UtilisateursPage } from '@/pages/UtilisateursPage';
import { ParametresPage } from '@/pages/ParametresPage';

/**
 * Toutes les routes privées, enveloppées une seule fois par ProtectedRoute
 * (authentification) + DashboardLayout (sidebar/header communs). Le RBAC
 * fin par rôle est appliqué à l'intérieur de chaque page via RoleGuard.
 */
export function PrivateRoutes() {
  return (
    <Route
      element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }
    >
      <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
      <Route path={ROUTES.CONTRIBUABLES} element={<ContribuablesListPage />} />
      <Route path={ROUTES.CONTRIBUABLE_DETAIL} element={<ContribuableDetailPage />} />
      <Route path={ROUTES.DETTES_FISCALES} element={<DettesFiscalesPage />} />
      <Route path={ROUTES.CALENDRIER_FISCAL} element={<CalendrierFiscalPage />} />
      <Route path={ROUTES.ECHEANCES_FISCALES} element={<EcheancesFiscalesPage />} />
      <Route path={ROUTES.PAIEMENTS} element={<PaiementsPage />} />
      <Route path={ROUTES.MORATOIRES} element={<Navigate to={ROUTES.PAIEMENTS} replace />} />
      <Route path={ROUTES.RELANCES} element={<RelancesPage />} />
      <Route path={ROUTES.CAMPAGNES} element={<CampagnesRelancePage />} />
      <Route path={ROUTES.MODELES_MESSAGE} element={<ModelesMessagePage />} />
      <Route path={ROUTES.NOTIFICATIONS} element={<NotificationsPage />} />
      <Route path={ROUTES.STATISTIQUES} element={<StatistiquesPage />} />
      <Route path={ROUTES.RAPPORTS} element={<RapportsPage />} />
      <Route path={ROUTES.SCORING_RISQUE} element={<ScoringRisquePage />} />
      <Route path={ROUTES.CARTOGRAPHIE} element={<CartographiePage />} />
      <Route path={ROUTES.UTILISATEURS} element={<UtilisateursPage />} />
      <Route path={ROUTES.PARAMETRES} element={<ParametresPage />} />
    </Route>
  );
}