import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { notificationService } from '@/services/notificationService';
import type { NotificationInterne } from '@/types/notification.types';
import { useAuthContext } from './AuthContext';

interface NotificationContextValue {
  notifications: NotificationInterne[];
  nombreNonLues: number;
  rafraichir: () => Promise<void>;
  marquerCommeLue: (id: number) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const INTERVALLE_RAFRAICHISSEMENT_MS = 60_000; // 1 minute

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { estAuthentifie } = useAuthContext();
  const [notifications, setNotifications] = useState<NotificationInterne[]>([]);

  const rafraichir = useCallback(async () => {
    if (!estAuthentifie) return;
    try {
      const donnees = await notificationService.listerNonLues();
      setNotifications(donnees);
    } catch {
      // Échec silencieux : les notifications ne doivent pas bloquer le reste de l'app
    }
  }, [estAuthentifie]);

  useEffect(() => {
    rafraichir();
    const intervalle = setInterval(rafraichir, INTERVALLE_RAFRAICHISSEMENT_MS);
    return () => clearInterval(intervalle);
  }, [rafraichir]);

  async function marquerCommeLue(id: number) {
    await notificationService.marquerCommeLue(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <NotificationContext.Provider
      value={{ notifications, nombreNonLues: notifications.length, rafraichir, marquerCommeLue }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext doit être utilisé à l’intérieur de NotificationProvider');
  }
  return context;
}