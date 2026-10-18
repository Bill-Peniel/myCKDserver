import type { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "primary" | "info" | "warning" | "success" | "destructive" | "violet";

const TONES: Record<Tone, { icon: string; glow: string }> = {
  primary: { icon: "bg-primary/10 text-primary ring-primary/20", glow: "from-primary/15" },
  info: { icon: "bg-info/10 text-info ring-info/20", glow: "from-info/15" },
  warning: { icon: "bg-warning/10 text-warning ring-warning/20", glow: "from-warning/15" },
  success: { icon: "bg-success/10 text-success ring-success/20", glow: "from-success/15" },
  destructive: { icon: "bg-destructive/10 text-destructive ring-destructive/20", glow: "from-destructive/15" },
  violet: { icon: "bg-chart-3/10 text-chart-3 ring-chart-3/20", glow: "from-chart-3/15" },
};

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  tone?: Tone;
  /** Texte secondaire sous la valeur */
  hint?: ReactNode;
  href?: string;
  className?: string;
}

export function StatCard({ label, value, icon, tone = "primary", hint, href, className }: StatCardProps) {
  const t = TONES[tone];
  const body = (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card p-5 shadow-card transition-all duration-200",
        href && "hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-float",
        className,
      )}
    >
      {/* Halo d'accent discret */}
      <div className={cn("pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br to-transparent blur-2xl opacity-70", t.glow)} />
      <div className="relative flex items-start justify-between gap-3">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-inset [&_svg]:h-[18px] [&_svg]:w-[18px]", t.icon)}>
          {icon}
        </div>
        {href && (
          <ArrowUpRight className="h-4 w-4 text-muted-foreground/60 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
        )}
      </div>
      <div className="relative mt-4 space-y-1">
        <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
        <p className="tabular text-[28px] font-semibold leading-none tracking-tight text-foreground">{value}</p>
        {hint && <p className="pt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );

  return href ? <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">{body}</Link> : body;
}
