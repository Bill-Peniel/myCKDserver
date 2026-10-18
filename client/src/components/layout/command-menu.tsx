import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CalendarPlus, FlaskConical, Moon, Sun, UserPlus } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { StageBadge, UserAvatar } from "@/components/kit";
import { useTheme } from "@/lib/theme";
import { ADMIN_NAV, DOCTOR_NAV, SETTINGS_ITEM } from "./nav";

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admin?: boolean;
}

export function CommandMenu({ open, onOpenChange, admin = false }: CommandMenuProps) {
  const [, setLocation] = useLocation();
  const { resolvedMode, toggleMode } = useTheme();

  // Raccourci clavier ⌘K / Ctrl+K
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // `key` peut être absent (événements émis par l'autoremplissage du navigateur)
      if (e.key?.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  const { data: patients = [] } = useQuery<any[]>({
    queryKey: [admin ? "/api/admin/patients" : "/api/patients"],
    queryFn: async () => {
      const res = await fetch(admin ? "/api/admin/patients" : "/api/patients", { credentials: "include" });
      return res.ok ? res.json() : [];
    },
    enabled: open,
  });

  const go = (href: string) => {
    onOpenChange(false);
    setLocation(href);
  };

  const navItems = [...(admin ? ADMIN_NAV : DOCTOR_NAV).flatMap((g) => g.items), ...(admin ? [] : [SETTINGS_ITEM])];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Rechercher un patient, une page, une action…" />
      <CommandList className="max-h-[420px]">
        <CommandEmpty>Aucun résultat.</CommandEmpty>

        {!admin && (
          <CommandGroup heading="Actions rapides">
            <CommandItem onSelect={() => go("/patients/add")}>
              <UserPlus className="h-4 w-4 text-muted-foreground" /> Nouveau patient
            </CommandItem>
            <CommandItem onSelect={() => go("/lab-results/add")}>
              <FlaskConical className="h-4 w-4 text-muted-foreground" /> Saisir un résultat de labo
            </CommandItem>
            <CommandItem onSelect={() => go("/appointments")}>
              <CalendarPlus className="h-4 w-4 text-muted-foreground" /> Planifier un rendez-vous
            </CommandItem>
          </CommandGroup>
        )}

        <CommandGroup heading="Navigation">
          {navItems.map((item) => (
            <CommandItem key={item.href} onSelect={() => go(item.href)}>
              <item.icon className="h-4 w-4 text-muted-foreground" /> {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        {patients.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Patients">
              {patients.slice(0, 50).map((p) => (
                <CommandItem
                  key={p._id}
                  value={`${p.user?.firstName} ${p.user?.lastName} ${p.user?.email}`}
                  onSelect={() => go(admin ? "/admin/patients" : `/patients/${p._id}`)}
                >
                  <UserAvatar firstName={p.user?.firstName} lastName={p.user?.lastName} size="xs" />
                  <span className="flex-1 truncate">{p.user?.firstName} {p.user?.lastName}</span>
                  {p.ckdStage && <StageBadge stage={p.ckdStage} />}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />
        <CommandGroup heading="Préférences">
          <CommandItem onSelect={() => { toggleMode(); onOpenChange(false); }}>
            {resolvedMode === "dark" ? <Sun className="h-4 w-4 text-muted-foreground" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
            {resolvedMode === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
            <CommandShortcut>Thème</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
