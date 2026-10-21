import { useAuthContext } from '@/context/AuthContext';
import { useThemeContext } from '@/context/ThemeContext';
import { NotificationBell } from '@/components/metier/NotificationBell';
import { ROLES_LIBELLES } from '@/utils/constants';

export function Header() {
  const { utilisateur, logout } = useAuthContext();
  const { basculerSidebar, basculerSidebarMobile, themeMode, basculerThemeMode } = useThemeContext();

  const roleAffiche = utilisateur?.roles[0]?.replace('ROLE_', '') ?? '';

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white dark:bg-[#1a0808] dark:border-[#381212] px-4 py-3 shadow-sm transition-colors duration-300">
      {/* Hamburger — desktop: réduit/agrandit ; mobile: ouvre/ferme le drawer */}
      <div className="flex items-center gap-3">
        <button
          onClick={basculerSidebar}
          onClickCapture={(e) => {
            if (window.innerWidth < 1024) {
              e.stopPropagation();
              basculerSidebarMobile();
            }
          }}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-[#2e1010] dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fiscal-bordeaux"
          aria-label="Basculer le menu"
        >
          {/* Icône SVG hamburger */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Badge récapitulatif du mode d'affichage */}
        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-[#240c0c] px-3 py-1 text-xs font-semibold text-gray-700 dark:text-red-200 border border-gray-200 dark:border-[#421414]">
          <span className="h-2 w-2 rounded-full bg-fiscal-bordeaux animate-pulse" />
          <span>DGI Madagascar · Portails</span>
        </span>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* COMMUTATEUR DE MODE CLAIR / SOMBRE BORDEAUX */}
        <button
          type="button"
          onClick={basculerThemeMode}
          className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition-all shadow-xs border ${
            themeMode === 'dark'
              ? 'bg-[#2a0e0e] text-amber-300 border-[#5c1616] hover:bg-[#381212]'
              : 'bg-slate-100 text-slate-800 border-gray-300 hover:bg-slate-200'
          }`}
          title={themeMode === 'dark' ? 'Passer en Mode Clair Officiel' : 'Passer en Mode Sombre Bordeaux'}
        >
          {themeMode === 'dark' ? (
            <>
              <span className="text-sm">🌙</span>
              <span className="hidden md:inline">Mode Sombre Bordeaux</span>
              <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            </>
          ) : (
            <>
              <span className="text-sm">☀️</span>
              <span className="hidden md:inline">Mode Clair Officiel</span>
            </>
          )}
        </button>

        <NotificationBell />

        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{utilisateur?.nomComplet}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{ROLES_LIBELLES[roleAffiche] ?? roleAffiche}</p>
        </div>

        <button
          onClick={logout}
          className="rounded-lg border border-fiscal-bordeaux px-3 py-1.5 text-xs font-bold text-fiscal-bordeaux dark:text-red-300 dark:border-red-900 transition-colors hover:bg-fiscal-bordeaux hover:text-white dark:hover:bg-fiscal-bordeaux dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fiscal-bordeaux"
        >
          Déconnexion
        </button>
      </div>
    </header>
  );
}