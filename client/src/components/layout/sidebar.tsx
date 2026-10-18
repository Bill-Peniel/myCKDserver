import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronsUpDown, LogOut, PanelLeftClose, PanelLeftOpen, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Logo, LogoMark, UserAvatar } from "@/components/kit";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ADMIN_NAV, DOCTOR_NAV, SETTINGS_ITEM, isActive, type NavItem } from "./nav";

interface SidebarProps {
  admin?: boolean;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  /** Appelé après un clic sur un lien (fermeture du menu mobile) */
  onNavigate?: () => void;
  className?: string;
}

function useUnreadCount(enabled: boolean) {
  const { data } = useQuery<{ notifications: { isRead: boolean }[] }>({
    queryKey: ["/api/notifications"],
    enabled,
  });
  return data?.notifications?.filter((n) => !n.isRead).length ?? 0;
}

export function Sidebar({ admin = false, collapsed = false, onToggleCollapsed, onNavigate, className }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const unread = useUnreadCount(!admin && !!user);
  const groups = admin ? ADMIN_NAV : DOCTOR_NAV;

  const renderItem = (item: NavItem) => {
    const active = isActive(location, item.href);
    const count = item.badge === "notifications" ? unread : 0;
    const link = (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "group relative flex h-9 items-center gap-3 rounded-lg px-2.5 text-[13.5px] font-medium transition-colors",
          active
            ? "bg-background text-foreground shadow-card ring-1 ring-border dark:bg-sidebar-accent dark:ring-0"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          collapsed && "justify-center px-0",
        )}
      >
        <item.icon className={cn("h-[18px] w-[18px] shrink-0 transition-colors", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
        {!collapsed && <span className="truncate">{item.label}</span>}
        {count > 0 && !collapsed && (
          <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground tabular">
            {count > 99 ? "99+" : count}
          </span>
        )}
        {count > 0 && collapsed && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-sidebar" />}
      </Link>
    );

    if (!collapsed) return link;
    return (
      <Tooltip key={item.href}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={10}>{item.label}</TooltipContent>
      </Tooltip>
    );
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200",
          collapsed ? "w-[68px]" : "w-64",
          className,
        )}
      >
        {/* Marque */}
        <div className={cn("flex h-14 items-center border-b border-sidebar-border px-4", collapsed && "justify-center px-0")}>
          <Link href={admin ? "/admin/dashboard" : "/dashboard"} onClick={onNavigate} className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {collapsed ? <LogoMark /> : <Logo subtitle={admin ? "Administration" : "Espace médecin"} />}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          {groups.map((group) => (
            <div key={group.label} className="space-y-1">
              {!collapsed ? (
                <p className="px-2.5 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">{group.label}</p>
              ) : (
                <div className="mx-auto mb-2 h-px w-6 bg-sidebar-border" />
              )}
              {group.items.map(renderItem)}
            </div>
          ))}
        </nav>

        {/* Bas de barre : paramètres, repli, utilisateur */}
        <div className="space-y-1 border-t border-sidebar-border p-3">
          {!admin && renderItem(SETTINGS_ITEM)}
          {onToggleCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapsed}
              className={cn(
                "hidden h-9 w-full items-center gap-3 rounded-lg px-2.5 text-[13.5px] font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent md:flex",
                collapsed && "justify-center px-0",
              )}
              aria-label={collapsed ? "Déplier la barre latérale" : "Replier la barre latérale"}
            >
              {collapsed ? <PanelLeftOpen className="h-[18px] w-[18px] text-muted-foreground" /> : <PanelLeftClose className="h-[18px] w-[18px] text-muted-foreground" />}
              {!collapsed && <span>Replier</span>}
            </button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "mt-1 flex w-full items-center gap-3 rounded-lg p-1.5 text-left transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  collapsed && "justify-center",
                )}
              >
                <UserAvatar firstName={user?.firstName} lastName={user?.lastName} size="sm" />
                {!collapsed && (
                  <>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-foreground">
                        {admin ? "" : "Dr. "}{user?.firstName} {user?.lastName}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">{user?.email}</span>
                    </span>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side={collapsed ? "right" : "top"} align="start" className="w-60">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {!admin && (
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/settings" onClick={onNavigate}>
                    <Settings className="h-4 w-4" /> Paramètres
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                <LogOut className="h-4 w-4" /> Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </TooltipProvider>
  );
}
