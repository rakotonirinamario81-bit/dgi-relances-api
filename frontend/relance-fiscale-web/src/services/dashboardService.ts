import { apiClient } from './apiClient';
import type { DashboardStats } from '@/types/dashboard.types';

export const dashboardService = {
  async obtenirStatistiques(): Promise<DashboardStats> {
    const { data } = await apiClient.get<DashboardStats>('/dashboard');
    return data;
  },
};