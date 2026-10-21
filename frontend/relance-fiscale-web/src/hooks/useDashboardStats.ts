import { useCallback, useEffect, useState } from 'react';
import { dashboardService } from '@/services/dashboardService';
import type { DashboardStats } from '@/types/dashboard.types';
import { extraireMessageErreur } from '@/services/apiClient';

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const recharger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      setStats(await dashboardService.obtenirStatistiques());
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    recharger();
  }, [recharger]);

  return { stats, chargement, erreur, recharger };
}