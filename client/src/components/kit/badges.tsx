import { cn, getCKDStageColor, getCKDStageLabel, getStatusColor } from "@/lib/utils";

const pill = "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap";

/** Stade MRC (Stage 1 → Stage 5) avec pastille colorée */
export function StageBadge({ stage, className }: { stage?: string | null; className?: string }) {
  const c = getCKDStageColor(stage ?? "");
  return (
    <span className={cn(pill, c.bg, c.text, c.border, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {getCKDStageLabel(stage)}
    </span>
  );
}

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  cancelled: "Annulé",
  completed: "Terminé",
};

/** Statut de rendez-vous */
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const c = getStatusColor(status);
  return (
    <span className={cn(pill, c.bg, c.text, c.border, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

const SEVERITY: Record<string, { label: string; cls: string; dot: string }> = {
  error: { label: "Critique", cls: "bg-destructive/10 text-destructive border-destructive/25", dot: "bg-destructive" },
  warning: { label: "Attention", cls: "bg-warning/10 text-warning border-warning/25", dot: "bg-warning" },
  info: { label: "Info", cls: "bg-info/10 text-info border-info/25", dot: "bg-info" },
  dfg: { label: "DFG", cls: "bg-chart-3/10 text-chart-3 border-chart-3/25", dot: "bg-chart-3" },
};

/** Gravité d'une notification (error, warning, info, dfg) */
export function SeverityBadge({ severity, className }: { severity?: string; className?: string }) {
  const s = SEVERITY[severity ?? "info"] ?? SEVERITY.info;
  return (
    <span className={cn(pill, s.cls, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

/** Résultat de labo par rapport à la plage normale */
export function RangeBadge({ value, min, max, className }: { value: number; min?: number | null; max?: number | null; className?: string }) {
  const low = min != null && value < min;
  const high = max != null && value > max;
  const cls = low || high ? "bg-destructive/10 text-destructive border-destructive/25" : "bg-success/10 text-success border-success/25";
  const label = low ? "Bas" : high ? "Élevé" : "Normal";
  return (
    <span className={cn(pill, cls, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", low || high ? "bg-destructive" : "bg-success")} />
      {label}
    </span>
  );
}
