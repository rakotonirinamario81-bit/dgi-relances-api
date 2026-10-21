import { useNotifications } from '@/hooks/useNotifications';
import { formaterDateHeureFr } from '@/utils/formatDate';
import { Button } from '@/components/common/Button';

export function NotificationsPage() {
  const { notifications, marquerCommeLue } = useNotifications();

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Notifications</h1>

      {notifications.length === 0 ? (
        <p className="text-sm text-gray-400">Aucune notification non lue.</p>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} className="flex items-start justify-between rounded border border-gray-200 bg-white p-4">
              <div>
                <p className="text-sm text-gray-800">{n.contenu}</p>
                <p className="mt-1 text-xs text-gray-400">{formaterDateHeureFr(n.dateCreation)}</p>
              </div>
              <Button variante="fantome" onClick={() => marquerCommeLue(n.id)}>
                Marquer comme lue
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}