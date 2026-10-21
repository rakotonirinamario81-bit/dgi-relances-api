import { apiClient } from './apiClient';
import type { CanalNotification, ModeleMessage, ModeleMessageDTO } from '@/types/modeleMessage.types';

export const modeleMessageService = {
  async creer(dto: ModeleMessageDTO): Promise<ModeleMessage> {
    const { data } = await apiClient.post<ModeleMessage>('/modeles-message', dto);
    return data;
  },

  async listerTous(): Promise<ModeleMessage[]> {
    const { data } = await apiClient.get<ModeleMessage[]>('/modeles-message');
    return data;
  },

  async listerParCanal(canal: CanalNotification): Promise<ModeleMessage[]> {
    const { data } = await apiClient.get<ModeleMessage[]>('/modeles-message', { params: { canal } });
    return data;
  },
};