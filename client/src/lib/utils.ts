import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | Date, options: Intl.DateTimeFormatOptions = {}): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (Number.isNaN(date.getTime())) return '—';

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  return new Intl.DateTimeFormat('fr-FR', { ...defaultOptions, ...options }).format(date);
}

export function formatShortDate(dateString: string | Date): string {
  return formatDate(dateString, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' });

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return "à l'instant";
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`;
}

// Classes "soft" (fond teinté + texte) compatibles mode clair et sombre
const STAGE_CLASSES: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  'Stage 1': { bg: 'bg-stage-1/10', text: 'text-stage-1', dot: 'bg-stage-1', border: 'border-stage-1/25' },
  'Stage 2': { bg: 'bg-stage-2/10', text: 'text-stage-2', dot: 'bg-stage-2', border: 'border-stage-2/25' },
  'Stage 3A': { bg: 'bg-stage-3a/10', text: 'text-stage-3a', dot: 'bg-stage-3a', border: 'border-stage-3a/25' },
  'Stage 3B': { bg: 'bg-stage-3b/10', text: 'text-stage-3b', dot: 'bg-stage-3b', border: 'border-stage-3b/25' },
  'Stage 4': { bg: 'bg-stage-4/10', text: 'text-stage-4', dot: 'bg-stage-4', border: 'border-stage-4/25' },
  'Stage 5': { bg: 'bg-stage-5/10', text: 'text-stage-5', dot: 'bg-stage-5', border: 'border-stage-5/25' },
};

const NEUTRAL = { bg: 'bg-muted', text: 'text-muted-foreground', dot: 'bg-muted-foreground', border: 'border-border' };

export function getCKDStageColor(stage: string): { bg: string; text: string; dot: string; border: string } {
  return STAGE_CLASSES[stage] ?? NEUTRAL;
}

export function getCKDStageLabel(stage?: string | null): string {
  return stage ? stage.replace('Stage', 'Stade') : 'Non défini';
}

export function getStatusColor(status: string): { bg: string; text: string; dot: string; border: string } {
  switch (status) {
    case 'pending':
      return { bg: 'bg-warning/10', text: 'text-warning', dot: 'bg-warning', border: 'border-warning/25' };
    case 'confirmed':
      return { bg: 'bg-info/10', text: 'text-info', dot: 'bg-info', border: 'border-info/25' };
    case 'cancelled':
      return { bg: 'bg-destructive/10', text: 'text-destructive', dot: 'bg-destructive', border: 'border-destructive/25' };
    case 'completed':
      return { bg: 'bg-success/10', text: 'text-success', dot: 'bg-success', border: 'border-success/25' };
    default:
      return NEUTRAL;
  }
}

export function getAlertBgColor(type: string): string {
  switch (type) {
    case 'critical':
    case 'error':
      return 'bg-destructive/10';
    case 'warning':
      return 'bg-warning/10';
    case 'info':
      return 'bg-info/10';
    case 'dfg':
      return 'bg-chart-3/10';
    default:
      return 'bg-muted';
  }
}

export function getAlertTextColor(type: string): string {
  switch (type) {
    case 'critical':
    case 'error':
      return 'text-destructive';
    case 'warning':
      return 'text-warning';
    case 'info':
      return 'text-info';
    case 'dfg':
      return 'text-chart-3';
    default:
      return 'text-muted-foreground';
  }
}

export function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

export function getAvatarColor(initials: string): string {
  // Couleur déterministe à partir des initiales, en teinte douce
  const hash = (initials.charCodeAt(0) || 0) + (initials.length > 1 ? initials.charCodeAt(1) : 0);

  const colors = [
    'bg-primary/10 text-primary',
    'bg-chart-2/10 text-chart-2',
    'bg-chart-3/10 text-chart-3',
    'bg-chart-4/10 text-chart-4',
    'bg-chart-5/10 text-chart-5',
    'bg-success/10 text-success',
  ];

  return colors[hash % colors.length];
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function (...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}
