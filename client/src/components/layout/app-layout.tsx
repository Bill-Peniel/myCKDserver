import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { Header } from '@/components/layout/header';
import { useAuth } from '@/hooks/use-auth';
import { useMobile } from '@/hooks/use-mobile';
import { PageLoader } from '@/components/ui/loader';
import { useLocation } from 'wouter';
import { Menu } from 'lucide-react';


interface AppLayoutProps {
  children: React.ReactNode;
  isAdmin?: boolean;
}

export function AppLayout({ children, isAdmin = false }: AppLayoutProps) {
  const { user, loading } = useAuth();
  const isMobile = useMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const hideHeader = location.pathname === '/admin/dashboard';

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar on route change or window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [sidebarOpen]);

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar for desktop or when opened on mobile */}
      {isAdmin ? (
        <AdminSidebar
          isMobile={isMobile}
          isOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
        />
      ) : (
        <Sidebar
          isMobile={isMobile}
          isOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
        />
      )}

      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {isAdmin ? (
          <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow md:hidden">
            <button 
              className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:bg-gray-100 focus:text-gray-600"
              onClick={toggleSidebar}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        ) : (
          <Header 
            toggleSidebar={toggleSidebar}
            user={user}
          />
        )}

        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {isAdmin ? (
                // Rendu admin sans les composants médecin
                <div className="admin-content">{children}</div>
              ) : (
                // Rendu normal pour les médecins
                children
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Backdrop for mobile sidebar */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75"
          onClick={toggleSidebar}
        ></div>
      )}
    </div>
  );
}