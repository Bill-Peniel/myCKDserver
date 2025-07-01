
import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Home, Users, Settings, X } from 'lucide-react';

interface AdminSidebarProps {
  isMobile: boolean;
  isOpen: boolean;
  toggleSidebar: () => void;
}

export function AdminSidebar({ isMobile, isOpen, toggleSidebar }: AdminSidebarProps) {
  const [location] = useLocation();

  if (isMobile && !isOpen) {
    return null;
  }

  const navItems = [
    {
      label: 'Tableau de bord',
      icon: <Home className="mr-3 h-6 w-6 text-white" />,
      href: '/admin/dashboard'
    },
    { 
      label: 'Patients', 
      icon: <Users className="mr-3 h-6 w-6 text-white" />,
      href: '/admin/patients'
    },
    { 
      label: 'Médecins', 
      icon: <Users className="mr-3 h-6 w-6 text-white" />,
      href: '/admin/doctors'
    },
    
  ];

  return (
    <div className={cn(
      "flex flex-col w-64 bg-[var(--primary-dark)]",
      isMobile && "fixed inset-y-0 left-0 z-50"
    )}>
      {isMobile && (
        <div className="absolute top-0 right-0 pt-4 pr-4">
          <button
            className="text-white focus:outline-none"
            onClick={toggleSidebar}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      )}

      <div className="flex items-center h-16 flex-shrink-0 px-4 bg-primary">
        <div className="text-white text-xl font-bold">Administration</div>
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => (
            <Link 
              key={item.href}
              href={item.href}
              onClick={isMobile ? toggleSidebar : undefined}
              className={cn(
                "group flex items-center px-2 py-2 text-sm font-medium rounded-md text-white",
                location === item.href 
                  ? "bg-[var(--primary-light)]" 
                  : "hover:bg-[var(--primary-light)]"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
