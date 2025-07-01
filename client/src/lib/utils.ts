import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | Date, options: Intl.DateTimeFormatOptions = {}): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(date);
}

export function formatTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
}

export function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) {
    return `${seconds} seconds ago`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
  
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} month${months !== 1 ? 's' : ''} ago`;
  }
  
  const years = Math.floor(months / 12);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`;
}

export function getCKDStageColor(stage: string): { bg: string, text: string } {
  switch (stage) {
    case 'Stage 1':
      return { bg: 'bg-green-100', text: 'text-green-800' };
    case 'Stage 2':
      return { bg: 'bg-yellow-100', text: 'text-yellow-800' };
    case 'Stage 3A':
      return { bg: 'bg-orange-100', text: 'text-orange-800' };
    case 'Stage 3B':
      return { bg: 'bg-orange-100', text: 'text-orange-800' };
    case 'Stage 4':
      return { bg: 'bg-red-100', text: 'text-red-800' };
    case 'Stage 5':
      return { bg: 'bg-red-900', text: 'text-white' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-800' };
  }
}

export function getStatusColor(status: string): { bg: string, text: string } {
  switch (status) {
    case 'pending':
      return { bg: 'bg-yellow-100', text: 'text-yellow-800' };
    case 'confirmed':
      return { bg: 'bg-blue-100', text: 'text-blue-800' };
    case 'cancelled':
      return { bg: 'bg-red-100', text: 'text-red-800' };
    case 'completed':
      return { bg: 'bg-green-100', text: 'text-green-800' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-800' };
  }
}

export function getAlertBgColor(type: string): string {
  switch (type) {
    case 'critical':
      return 'bg-red-100';
    case 'warning':
      return 'bg-orange-100';
    case 'info':
      return 'bg-yellow-100';
    case 'dfg':
      return 'bg-purple-100';
    default:
      return 'bg-gray-100';
  }
}

export function getAlertTextColor(type: string): string {
  switch (type) {
    case 'critical':
      return 'text-red-600';
    case 'warning':
      return 'text-orange-600';
    case 'info':
      return 'text-yellow-600';
    default:
      return 'text-gray-600';
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
  // Generate a deterministic color based on initials
  const hash = initials.charCodeAt(0) + (initials.length > 1 ? initials.charCodeAt(1) : 0);
  
  // Palette plus colorée et plus visible, avec contraste texte optimisé pour tous les modes
  const colors = [
    'bg-primary text-primary-foreground',
    'bg-indigo-500 text-white',
    'bg-green-500 text-white',
    'bg-purple-500 text-white',
    'bg-rose-500 text-white',
    'bg-amber-500 text-white',
    'bg-sky-500 text-white',
    'bg-emerald-500 text-white',
    'bg-teal-500 text-white',
    'bg-blue-500 text-white'
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
