import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  sidebarReduite: boolean;
  basculerSidebar: () => void;
  sidebarMobileOuverte: boolean;
  ouvrirSidebarMobile: () => void;
  fermerSidebarMobile: () => void;
  basculerSidebarMobile: () => void;
  
  // Nouveau : Gestion du Mode Sombre Bordeaux
  themeMode: ThemeMode;
  basculerThemeMode: () => void;
  definirThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [sidebarReduite, setSidebarReduite] = useState(false);
  const [sidebarMobileOuverte, setSidebarMobileOuverte] = useState(false);

  // Initialisation du mode sombre depuis localStorage ou préférence système
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const sauvegarde = localStorage.getItem('dgi_theme_mode');
    if (sauvegarde === 'dark' || sauvegarde === 'light') {
      return sauvegarde;
    }
    return 'light';
  });

  // Appliquer la classe 'dark' sur le document HTML
  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('dgi_theme_mode', themeMode);
  }, [themeMode]);

  // Fermer automatiquement le menu mobile si la fenêtre s'élargit en mode desktop (>= 1024px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarMobileOuverte(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const basculerThemeMode = () => {
    setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider
      value={{
        sidebarReduite,
        basculerSidebar: () => setSidebarReduite((prev) => !prev),
        sidebarMobileOuverte,
        ouvrirSidebarMobile: () => setSidebarMobileOuverte(true),
        fermerSidebarMobile: () => setSidebarMobileOuverte(false),
        basculerSidebarMobile: () => setSidebarMobileOuverte((prev) => !prev),
        themeMode,
        basculerThemeMode,
        definirThemeMode: (mode: ThemeMode) => setThemeMode(mode),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext doit être utilisé à l’intérieur de ThemeProvider');
  }
  return context;
}