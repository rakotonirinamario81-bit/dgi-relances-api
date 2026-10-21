import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';
import { PageErrorBoundary } from '@/components/common/PageErrorBoundary';
import { useThemeContext } from '@/context/ThemeContext';

export function DashboardLayout() {
  const { sidebarMobileOuverte, fermerSidebarMobile } = useThemeContext();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Backdrop mobile — visible uniquement quand le drawer est ouvert */}
      {sidebarMobileOuverte && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={fermerSidebarMobile}
          aria-hidden="true"
        />
      )}

      <Sidebar />

      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <PageErrorBoundary>
            <Outlet />
          </PageErrorBoundary>
        </main>
        <Footer />
      </div>
    </div>
  );
}