import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Bell, CheckCheck, ChevronRight, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SeverityBadge, ThemeToggle } from "@/components/kit";
import { cn, getTimeAgo } from "@/lib/utils";
import { findNavItem } from "./nav";

interface HeaderProps {
  admin?: boolean;
  onOpenMobileNav: () => void;
  onOpenCommand: () => void;
}

function NotificationsPopover() {
  const { data } = useQuery<{ notifications: any[] }>({ queryKey: ["/api/notifications"] });
  const notifications = data?.notifications ?? [];
  const unread = notifications.filter((n) => !n.isRead);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground" aria-label="Notifications">
          <Bell />
          {unread.length > 0 && (
            <span className="absolute right-2 top-2 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-primary" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">
              {unread.length > 0 ? `${unread.length} non lue${unread.length > 1 ? "s" : ""}` : "Tout est à jour"}
            </p>
          </div>
          <CheckCheck className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">Aucune notification</p>
          ) : (
            notifications.slice(0, 6).map((n) => (
              <div key={n._id} className={cn("flex gap-3 border-b px-4 py-3 last:border-0", !n.isRead && "bg-primary/[0.03]")}>
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.isRead ? "bg-transparent" : "bg-primary")} />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="line-clamp-2 text-[13px] leading-snug text-foreground">{n.message}</p>
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={n.severity} />
                    <span className="text-xs text-muted-foreground">{getTimeAgo(n.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="border-t p-2">
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link href="/notifications">Voir toutes les notifications</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function Header({ admin = false, onOpenMobileNav, onOpenCommand }: HeaderProps) {
  const [location] = useLocation();
  const current = findNavItem(location, admin);
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <header className="glass sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b px-4 sm:px-6">
      <Button variant="ghost" size="icon" className="-ml-2 md:hidden" onClick={onOpenMobileNav} aria-label="Ouvrir le menu">
        <Menu />
      </Button>

      {/* Fil d'Ariane */}
      <nav className="hidden min-w-0 items-center gap-1.5 text-sm sm:flex" aria-label="Fil d'Ariane">
        <span className="text-muted-foreground">{admin ? "Administration" : "Espace médecin"}</span>
        {current && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
            <span className="truncate font-medium text-foreground">{current.label}</span>
          </>
        )}
      </nav>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={onOpenCommand}
          className="group flex h-9 items-center gap-2 rounded-lg border bg-background px-3 text-sm text-muted-foreground shadow-xs transition-colors hover:bg-accent hover:text-foreground sm:w-64"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Rechercher…</span>
          <kbd className="ml-auto hidden h-5 items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:inline-flex">
            {isMac ? "⌘" : "Ctrl"} K
          </kbd>
        </button>
        <ThemeToggle />
        {!admin && <NotificationsPopover />}
      </div>
    </header>
  );
}
