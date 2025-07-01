import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { 
  Home, Users, FileText, Calendar, Bell, Settings, GitBranch, MessageSquare,
  Menu, X
} from 'lucide-react';

interface SidebarProps {
  isMobile: boolean;
  isOpen: boolean;
  toggleSidebar: () => void;
}

export function Sidebar({ isMobile, isOpen, toggleSidebar }: SidebarProps) {
  const [location] = useLocation();

  // Only show sidebar on mobile if it's open
  if (isMobile && !isOpen) {
    return null;
  }

  const navItems = [
    { 
      label: 'Dashboard', 
      icon: <Home className="mr-3 h-6 w-6 text-white" />,
      href: '/'
    },
    { 
      label: 'Patients', 
      icon: <Users className="mr-3 h-6 w-6 text-white" />,
      href: '/patients'
    },
    { 
      label: 'Lab Results', 
      icon: <FileText className="mr-3 h-6 w-6 text-white" />,
      href: '/lab-results'
    },
    { 
      label: 'Appointments', 
      icon: <Calendar className="mr-3 h-6 w-6 text-white" />,
      href: '/appointments'
    },
    { 
      label: 'Notifications', 
      icon: <Bell className="mr-3 h-6 w-6 text-white" />,
      href: '/notifications'
    },
    { 
      label: 'Workflows', 
      icon: <GitBranch className="mr-3 h-6 w-6 text-white" />,
      href: '/workflows'
    },
    { 
      label: 'Settings', 
      icon: <Settings className="mr-3 h-6 w-6 text-white" />,
      href: '/settings'
    },
    { 
      label: 'Assistant IA', 
      icon: <MessageSquare className="mr-3 h-6 w-6 text-white" />,
      href: '/chatbot'
    }
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
        <div className="text-white text-xl font-bold">CKD Care</div>
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

// Placeholder Chatbot component
function Chatbot() {
  return (
    <div>
      <h1>Chatbot Page</h1>
      <p>This is a placeholder for the chatbot integration.</p>
    </div>
  );
}

export default Chatbot;