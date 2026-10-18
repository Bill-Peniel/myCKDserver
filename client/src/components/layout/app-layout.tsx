import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { CommandMenu } from '@/components/layout/command-menu';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/use-auth';
import { PageLoader } from '@/components/ui/loader';

interface AppLayoutProps {
  children: React.ReactNode;
  isAdmin?: boolean;
}

const COLLAPSE_KEY = 'ckd-sidebar-collapsed';

export function AppLayout({ children, isAdmin = false }: AppLayoutProps) {
  const { loading } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    } catch {
      // préférence non persistée
    }
  }, [collapsed]);

  // Ferme le menu mobile à chaque changement de page
  useEffect(() => setMobileOpen(false), [location]);

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Barre latérale (bureau) */}
      <Sidebar
        admin={isAdmin}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
        className="hidden md:flex"
      />

      {/* Barre latérale (mobile) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 [&>button]:hidden">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar admin={isAdmin} onNavigate={() => setMobileOpen(false)} className="w-full border-r-0" />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          admin={isAdmin}
          onOpenMobileNav={() => setMobileOpen(true)}
          onOpenCommand={() => setCommandOpen(true)}
        />
        <main className="relative flex-1 overflow-y-auto focus:outline-none">
          <div key={location} className="mx-auto w-full max-w-7xl animate-fade-up px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>

      <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} admin={isAdmin} />
    </div>
  );
}
