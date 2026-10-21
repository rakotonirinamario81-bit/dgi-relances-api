import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { RoleGuard } from '@/auth/RoleGuard';
import { ROUTES, ROLES_RESPONSABLE_ET_PLUS, ROLES_ADMIN_SEUL } from '@/routes/routesConfig';
import { useThemeContext } from '@/context/ThemeContext';

// ─── Icônes SVG inline ───────────────────────────────────────────────────────
const Icon = ({ path, d2 }: { path: string; d2?: string }) => (
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
    className="shrink-0"
    aria-hidden="true"
  >
    <path d={path} />
    {d2 && <path d={d2} />}
  </svg>
);

const ICONS = {
  dashboard:    <Icon path="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
  contribuable: <Icon path="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
  dette:        <Icon path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  paiement:     <Icon path="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />,
  moratoire:    <Icon path="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  relance:      <Icon path="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
  calendrier:   <Icon path="M6 2v2M18 2v2M3 8h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />,
  echeance:     <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
  campagne:     <Icon path="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />,
  statistiques: <Icon path="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
  rapports:     <Icon path="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  scoring:      <Icon path="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />,
  cartographie: <Icon path="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />,
  portail:      <Icon path="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />,
  utilisateurs: <Icon path="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
  parametres:   <Icon path="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" d2="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />,
};

// ─── Composant lien ─────────────────────────────────────────────────────────
interface LienProps {
  to: string;
  icone: React.ReactNode;
  libelle: string;
  reduit: boolean;
  onNavigate?: () => void;
  external?: boolean;
  className?: string;
}

function LienNav({ to, icone, libelle, reduit, onNavigate, external, className }: LienProps) {
  const base =
    'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/80 transition-all duration-150 hover:bg-white/10 hover:text-white';
  const active =
    'bg-white/15 text-white shadow-inner border-l-2 border-fiscal-or font-semibold';

  return (
    <NavLink
      to={to}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      onClick={onNavigate}
      className={({ isActive }) => clsx(base, isActive && active, className)}
    >
      {icone}
      {!reduit && <span className="truncate">{libelle}</span>}
      {/* Tooltip desktop réduit */}
      {reduit && (
        <span
          className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 z-50"
        >
          {libelle}
        </span>
      )}
    </NavLink>
  );
}

// ─── Section avec titre ──────────────────────────────────────────────────────
function SectionTitre({ label, reduit }: { label: string; reduit: boolean }) {
  if (reduit) return <div className="my-2 mx-auto h-px w-8 bg-white/20" />;
  return (
    <p className="mt-5 mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/40">
      {label}
    </p>
  );
}

// ─── Sidebar principale ──────────────────────────────────────────────────────
export function Sidebar() {
  const { sidebarReduite, sidebarMobileOuverte, fermerSidebarMobile } = useThemeContext();

  return (
    <aside
      className={clsx(
        // Desktop : statique, transition de largeur
        'hidden lg:flex lg:flex-col lg:shrink-0 bg-fiscal-bordeaux text-white transition-all duration-300 ease-in-out',
        sidebarReduite ? 'lg:w-[72px]' : 'lg:w-64',
        // Mobile : drawer off-canvas fixe
        sidebarMobileOuverte
          ? 'flex flex-col fixed inset-y-0 left-0 z-50 w-72 shadow-2xl lg:relative lg:shadow-none'
          : 'fixed -left-full lg:static',
      )}
    >
      {/* ── En-tête branding DGI ── */}
      <div
        className={clsx(
          'flex items-center gap-3 border-b border-white/15 px-4 py-4',
          sidebarReduite && 'justify-center px-2',
        )}
      >
        {/* Badge / sceau DGI */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-fiscal-or bg-white/10 text-base font-black text-fiscal-or shadow">
          DGI
        </div>
        {!sidebarReduite && (
          <div className="overflow-hidden">
            <p className="truncate text-sm font-bold leading-tight text-white">Service Fiscal</p>
            <p className="truncate text-[10px] text-white/50 leading-tight">
              Direction Générale des Impôts
            </p>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-0.5">

        {/* Section 1 : Vue générale */}
        <SectionTitre label="Vue Générale" reduit={sidebarReduite} />
        <LienNav
          to={ROUTES.DASHBOARD}
          icone={ICONS.dashboard}
          libelle="Tableau de bord"
          reduit={sidebarReduite}
          onNavigate={fermerSidebarMobile}
        />

        {/* Section 2 : Recouvrement */}
        <SectionTitre label="Recouvrement" reduit={sidebarReduite} />
        <LienNav
          to={ROUTES.CONTRIBUABLES}
          icone={ICONS.contribuable}
          libelle="Contribuables"
          reduit={sidebarReduite}
          onNavigate={fermerSidebarMobile}
        />
        <LienNav
          to={ROUTES.DETTES_FISCALES}
          icone={ICONS.dette}
          libelle="Dettes fiscales"
          reduit={sidebarReduite}
          onNavigate={fermerSidebarMobile}
        />
        <LienNav
          to={ROUTES.PAIEMENTS}
          icone={ICONS.paiement}
          libelle="Paiements & Moratoires"
          reduit={sidebarReduite}
          onNavigate={fermerSidebarMobile}
        />
        <LienNav
          to={ROUTES.RELANCES}
          icone={ICONS.relance}
          libelle="Relances"
          reduit={sidebarReduite}
          onNavigate={fermerSidebarMobile}
        />

        {/* Section 3 : Calendrier */}
        <SectionTitre label="Calendrier & Échéances" reduit={sidebarReduite} />
        <LienNav
          to={ROUTES.CALENDRIER_FISCAL}
          icone={ICONS.calendrier}
          libelle="Calendrier fiscal"
          reduit={sidebarReduite}
          onNavigate={fermerSidebarMobile}
        />
        <LienNav
          to={ROUTES.ECHEANCES_FISCALES}
          icone={ICONS.echeance}
          libelle="Échéances & Déclarations"
          reduit={sidebarReduite}
          onNavigate={fermerSidebarMobile}
        />

        {/* Section 4 : Analyse & Pilotage (Responsable+) */}
        <RoleGuard rolesAutorises={ROLES_RESPONSABLE_ET_PLUS}>
          <SectionTitre label="Analyse & Pilotage" reduit={sidebarReduite} />
          <LienNav
            to={ROUTES.CAMPAGNES}
            icone={ICONS.campagne}
            libelle="Campagnes"
            reduit={sidebarReduite}
            onNavigate={fermerSidebarMobile}
          />
          <LienNav
            to={ROUTES.STATISTIQUES}
            icone={ICONS.statistiques}
            libelle="Statistiques"
            reduit={sidebarReduite}
            onNavigate={fermerSidebarMobile}
          />
          <LienNav
            to={ROUTES.RAPPORTS}
            icone={ICONS.rapports}
            libelle="Rapports"
            reduit={sidebarReduite}
            onNavigate={fermerSidebarMobile}
          />
          <LienNav
            to={ROUTES.SCORING_RISQUE}
            icone={ICONS.scoring}
            libelle="Scoring Prédictif IA"
            reduit={sidebarReduite}
            onNavigate={fermerSidebarMobile}
          />
          <LienNav
            to={ROUTES.CARTOGRAPHIE}
            icone={ICONS.cartographie}
            libelle="Cartographie Fiscale"
            reduit={sidebarReduite}
            onNavigate={fermerSidebarMobile}
          />
          <LienNav
            to={ROUTES.PUBLIC_VERIFICATION}
            icone={ICONS.portail}
            libelle="Portail Public (QR) ↗"
            reduit={sidebarReduite}
            onNavigate={fermerSidebarMobile}
            external
            className="text-fiscal-or hover:text-fiscal-or"
          />
        </RoleGuard>

        {/* Section 5 : Administration (Admin seul) */}
        <RoleGuard rolesAutorises={ROLES_ADMIN_SEUL}>
          <SectionTitre label="Administration" reduit={sidebarReduite} />
          <LienNav
            to={ROUTES.UTILISATEURS}
            icone={ICONS.utilisateurs}
            libelle="Utilisateurs"
            reduit={sidebarReduite}
            onNavigate={fermerSidebarMobile}
          />
          <LienNav
            to={ROUTES.PARAMETRES}
            icone={ICONS.parametres}
            libelle="Paramètres"
            reduit={sidebarReduite}
            onNavigate={fermerSidebarMobile}
          />
        </RoleGuard>
      </nav>

      {/* ── Bouton fermeture mobile (croix) ── */}
      <button
        onClick={fermerSidebarMobile}
        className="absolute right-3 top-3 rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white lg:hidden"
        aria-label="Fermer le menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </aside>
  );
}
