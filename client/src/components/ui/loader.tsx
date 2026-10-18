import React from 'react';
import { cn } from '@/lib/utils';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
}

export function Loader({ size = 'md', color = 'primary', className }: LoaderProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-[1.5px]',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-2'
  };

  const colorClasses = {
    primary: 'border-primary/20 border-t-primary',
    white: 'border-white/30 border-t-white',
    gray: 'border-muted-foreground/20 border-t-muted-foreground'
  };

  return (
    <div className={cn('flex justify-center items-center', className)} role="status" aria-label="Chargement">
      <span className={cn('animate-spin rounded-full', sizeClasses[size], colorClasses[color])} />
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="min-h-[60vh] w-full flex flex-col items-center justify-center gap-3">
      <Loader size="lg" />
      <p className="text-xs text-muted-foreground">Chargement…</p>
    </div>
  );
}
