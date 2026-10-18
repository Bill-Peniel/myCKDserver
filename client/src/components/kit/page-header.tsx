import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** Petit libellé au-dessus du titre (ex. section) */
  eyebrow?: ReactNode;
  /** Boutons alignés à droite */
  actions?: ReactNode;
  /** Élément avant le titre (bouton retour, avatar...) */
  leading?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, eyebrow, actions, leading, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {leading}
        <div className="min-w-0 space-y-1">
          {eyebrow && (
            <p className="text-xs font-medium uppercase tracking-wider text-primary">{eyebrow}</p>
          )}
          <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground sm:text-[26px]">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
