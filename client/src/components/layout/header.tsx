import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { cn, getAvatarColor } from '@/lib/utils';
import { Menu, Search, Bell, Settings, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Notification } from '@/lib/types';
import { t } from '@/lib/i18n'; // Added import for translations

interface HeaderProps {
  toggleSidebar: () => void;
  user: any;
}

export function Header({ toggleSidebar, user }: HeaderProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { data } = useQuery<{ notifications: Notification[] }>({
    queryKey: ['/api/notifications'],
    enabled: !!user,
  });

  const unreadNotifications = data?.notifications?.filter(n => !n.isRead).length || 0;

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout', {});
      localStorage.removeItem('auth');
      queryClient.clear();
      toast({
        title: "Déconnexion réussie",
      });
      // Force la redirection et le rechargement
      window.location.href = '/login';
      window.location.reload();
    } catch (error) {
      toast({
        title: "Erreur lors de la déconnexion",
        description: "Veuillez réessayer",
        variant: "destructive"
      });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/patients?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
      <button 
        className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:bg-gray-100 focus:text-gray-600 md:hidden"
        onClick={toggleSidebar}
      >
        <Menu className="h-6 w-6" />
      </button>

      <div className="flex-1 px-4 flex items-center justify-between">
        <div className="flex-1 flex justify-center max-w-2xl mx-auto">
          <form className="w-full flex" onSubmit={handleSearch}>
            <label htmlFor="search-field" className="sr-only">Search</label>
            <div className="relative w-full text-gray-400 focus-within:text-gray-600">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-primary" />
              </div>
              <Input 
                id="search-field"
                className="block w-full h-10 pl-10 pr-4 bg-background/50 border border-primary/20 rounded-full text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/30 focus-visible:border-primary/40 transition-colors"
                placeholder="Rechercher patients, tests..."
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
        </div>

        <div className="ml-4 flex items-center md:ml-6">
          {/* Notification Dropdown */}
          <div className="relative">
            <Link href="/notifications">
              <Button 
                variant="ghost" 
                size="icon" 
                className="p-1 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-500 focus:outline-none"
              >
                <span className="sr-only">View notifications</span>
                <Bell className="h-6 w-6" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
                )}
              </Button>
            </Link>
          </div>

          {/* Profile dropdown */}
          <div className="ml-3 relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="max-w-xs flex items-center text-sm rounded-full focus:outline-none"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="rounded-full p-[2px] bg-primary">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-background text-primary">
                        {user?.firstName && user?.lastName ? `${user.firstName[0]}${user.lastName[0]}` : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1.5">
                    <p className="text-sm font-semibold text-foreground">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-muted-foreground font-medium">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem asChild className="cursor-pointer gap-3 py-2">
                  <Link href="/settings" className="flex items-center">
                    <Settings className="h-4 w-4" /> 
                    <span>Paramètres</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer gap-3 py-2 text-red-500 hover:text-red-600 focus:text-red-600">
                  <LogOut className="h-4 w-4" />
                  <span>Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}