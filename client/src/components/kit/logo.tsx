import { cn } from "@/lib/utils";

/** Logo CKD Care : deux reins stylisés dans un carré arrondi */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary text-primary-foreground shadow-inner-highlight",
        className,
      )}
    >
      <span className="absolute inset-0 bg-gradient-to-br from-white/25 to-transparent" />
      <svg viewBox="0 0 32 32" className="relative h-[70%] w-[70%]" fill="currentColor" aria-hidden>
        <path d="M11 6c-3.6 0-6 3.6-6 9.5S7.4 26 11 26c2.4 0 3.6-1.8 3.6-4.2S12.8 18.7 12.8 17.5s1.8-2.5 1.8-4.8S13.4 6 11 6Zm10 0c3.6 0 6 3.6 6 9.5S24.6 26 21 26c-2.4 0-3.6-1.8-3.6-4.2s1.8-3.1 1.8-4.3-1.8-2.5-1.8-4.8S18.6 6 21 6Z" />
      </svg>
    </span>
  );
}

export function Logo({ className, subtitle }: { className?: string; subtitle?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="text-[15px] font-semibold tracking-tight text-foreground">CKD Care</span>
        {subtitle && <span className="mt-1 text-[11px] font-medium text-muted-foreground">{subtitle}</span>}
      </span>
    </span>
  );
}
