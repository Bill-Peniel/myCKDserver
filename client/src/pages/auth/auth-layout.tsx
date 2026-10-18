import type { ReactNode } from "react";
import { Link } from "wouter";
import { Activity, Bell, Calculator, ShieldCheck } from "lucide-react";
import { Logo, ThemeToggle } from "@/components/kit";

const HIGHLIGHTS = [
  { icon: Calculator, title: "DFG calculé automatiquement", text: "Le stade KDIGO est mis à jour à chaque créatinine." },
  { icon: Bell, title: "Alertes critiques", text: "Les valeurs hors normes remontent en priorité." },
  { icon: Activity, title: "Tendances patient", text: "Visualisez l'évolution de la fonction rénale." },
  { icon: ShieldCheck, title: "Accès cloisonné", text: "Chaque médecin ne voit que ses patients." },
];

/** Mise en page des écrans d'authentification : formulaire à gauche, visuel à droite */
export function AuthLayout({ title, description, children, footer }: { title: string; description: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="relative flex flex-col px-6 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Logo /></Link>
          <ThemeToggle />
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12 animate-fade-up">
          <div className="mb-8 space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {children}
          {footer && <div className="mt-8 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>

        <p className="text-center text-xs text-muted-foreground lg:text-left">
          © {new Date().getFullYear()} CKD Care · Hackathon IFRI / UAC
        </p>
      </div>

      {/* Panneau visuel */}
      <div className="relative hidden overflow-hidden border-l bg-surface lg:flex lg:flex-col lg:justify-center lg:px-16">
        <div className="bg-grid mask-radial-center absolute inset-0" />
        <div className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-primary/20 blur-[110px]" />
        <div className="absolute -bottom-40 -left-20 h-[360px] w-[360px] rounded-full bg-chart-2/15 blur-[110px]" />

        <div className="relative mx-auto w-full max-w-md">
          <p className="text-sm font-medium text-primary">Plateforme de suivi MRC</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight">
            Chaque patient, chaque analyse, <span className="text-gradient-primary">au même endroit.</span>
          </h2>

          <div className="mt-10 space-y-3">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }, i) => (
              <div
                key={title}
                className="flex items-start gap-4 rounded-xl border bg-card/80 p-4 shadow-card backdrop-blur animate-fade-up"
                style={{ animationDelay: `${150 + i * 90}ms` }}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
