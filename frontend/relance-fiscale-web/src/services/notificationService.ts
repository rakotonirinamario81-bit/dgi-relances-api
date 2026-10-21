import { apiClient } from './apiClient';
import type { NotificationInterne } from '@/types/notification.types';

export const notificationService = {
  async listerNonLues(): Promise<NotificationInterne[]> {
    const { data } = await apiClient.get<NotificationInterne[]>('/notifications/non-lues');
    return data;
  },

  async marquerCommeLue(id: number): Promise<void> {
    await apiClient.patch(`/notifications/${id}/lue`);
  },
};