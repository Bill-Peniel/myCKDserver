import type { LucideIcon } from "lucide-react";
import {
  Bell,
  CalendarDays,
  FlaskConical,
  LayoutDashboard,
  Settings,
  Sparkles,
  Stethoscope,
  Users,
  Workflow,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Affiche le nombre de notifications non lues */
  badge?: "notifications";
};

export type NavGroup = { label: string; items: NavItem[] };

export const DOCTOR_NAV: NavGroup[] = [
  {
    label: "Général",
    items: [
      { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
      { label: "Patients", href: "/patients", icon: Users },
      { label: "Résultats de labo", href: "/lab-results", icon: FlaskConical },
      { label: "Rendez-vous", href: "/appointments", icon: CalendarDays },
    ],
  },
  {
    label: "Suivi",
    items: [
      { label: "Notifications", href: "/notifications", icon: Bell, badge: "notifications" },
      { label: "Workflows", href: "/workflows", icon: Workflow },
      { label: "Assistant IA", href: "/chatbot", icon: Sparkles },
    ],
  },
];

export const ADMIN_NAV: NavGroup[] = [
  {
    label: "Administration",
    items: [
      { label: "Vue d'ensemble", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Médecins", href: "/admin/doctors", icon: Stethoscope },
      { label: "Patients", href: "/admin/patients", icon: Users },
    ],
  },
];

export const SETTINGS_ITEM: NavItem = { label: "Paramètres", href: "/settings", icon: Settings };

export function isActive(location: string, href: string) {
  return location === href || location.startsWith(`${href}/`);
}

export function findNavItem(location: string, admin: boolean): NavItem | undefined {
  const groups = admin ? ADMIN_NAV : DOCTOR_NAV;
  const items = [...groups.flatMap((g) => g.items), SETTINGS_ITEM];
  // L'entrée la plus spécifique l'emporte
  return items
    .filter((item) => isActive(location, item.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
}
