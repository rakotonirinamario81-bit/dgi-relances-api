import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { formaterDateHeureFr } from '@/utils/formatDate';

export function NotificationBell() {
  const { notifications, nombreNonLues, marquerCommeLue } = useNotifications();
  const [ouverte, setOuverte] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setOuverte((prev) => !prev)} className="relative p-2 text-gray-600 hover:text-gray-900">
        🔔
        {nombreNonLues > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] text-white">
            {nombreNonLues > 9 ? '9+' : nombreNonLues}
          </span>
        )}
      </button>

      {ouverte && (
        <div className="absolute right-0 mt-2 w-80 rounded border border-gray-200 bg-white shadow-lg z-40">
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-gray-400">Aucune notification</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => marquerCommeLue(n.id)}
                  className="block w-full border-b p-3 text-left hover:bg-gray-50"
                >
                  <p className="text-sm text-gray-800">{n.contenu}</p>
                  <p className="mt-1 text-xs text-gray-400">{formaterDateHeureFr(n.dateCreation)}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}