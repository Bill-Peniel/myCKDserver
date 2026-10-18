import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Bell,
  CalendarCheck,
  Calculator,
  Check,
  FileText,
  GitBranch,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo, ThemeToggle } from "@/components/kit";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

const STAGES = [
  { stage: "1", range: "≥ 90", label: "Fonction normale", color: "bg-stage-1" },
  { stage: "2", range: "60 – 89", label: "Diminution légère", color: "bg-stage-2" },
  { stage: "3A", range: "45 – 59", label: "Légère à modérée", color: "bg-stage-3a" },
  { stage: "3B", range: "30 – 44", label: "Modérée à sévère", color: "bg-stage-3b" },
  { stage: "4", range: "15 – 29", label: "Sévère", color: "bg-stage-4" },
  { stage: "5", range: "< 15", label: "Insuffisance terminale", color: "bg-stage-5" },
];

const CAPABILITIES = [
  "Calcul automatique du DFG",
  "Classification KDIGO",
  "Alertes sur valeurs critiques",
  "Rapports patients en PDF",
  "Rappels de rendez-vous par e-mail",
  "Workflows de suivi par stade",
  "Assistant IA spécialisé",
  "Mode sombre",
];

function Navbar() {
  const { isAuthenticated, user } = useAuth();
  const home = user?.role === "admin" ? "/admin/dashboard" : "/dashboard";
  return (
    <header className="fixed inset-x-0 top-4 z-50 px-4">
      <nav className="glass mx-auto flex h-14 max-w-5xl items-center gap-2 rounded-2xl border px-3 pl-4 shadow-float">
        <Link href="/" className="mr-4"><Logo /></Link>
        <div className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
          {[
            ["#fonctionnalites", "Fonctionnalités"],
            ["#stades", "Stades MRC"],
            ["#fonctionnement", "Fonctionnement"],
          ].map(([href, label]) => (
            <a key={href} href={href} className="rounded-lg px-3 py-1.5 transition-colors hover:bg-accent hover:text-foreground">
              {label}
            </a>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
          {isAuthenticated ? (
            <Button asChild size="sm">
              <Link href={home}>Tableau de bord <ArrowRight /></Link>
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">Se connecter <ArrowRight /></Link>
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
}

/** Aperçu stylisé de l'application (purement décoratif) */
function ProductPreview() {
  const bars = [62, 58, 57, 55, 52, 49, 47];
  return (
    <div className="relative mx-auto mt-16 max-w-5xl [perspective:2000px]">
      <div className="absolute -inset-x-20 -top-10 bottom-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.25),transparent_65%)] blur-2xl" />
      <motion.div
        initial={{ opacity: 0, rotateX: 18, y: 40 }}
        animate={{ opacity: 1, rotateX: 8, y: 0 }}
        transition={{ duration: 1.1, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="border-beam relative overflow-hidden rounded-2xl border bg-card shadow-float [transform-origin:top]"
      >
        {/* Barre de fenêtre */}
        <div className="flex h-10 items-center gap-2 border-b bg-muted/40 px-4">
          <span className="h-2.5 w-2.5 rounded-full bg-stage-4/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-stage-3a/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-stage-1/70" />
          <span className="mx-auto rounded-md bg-background px-12 py-0.5 text-[11px] text-muted-foreground">ckd-care.app/dashboard</span>
        </div>
        <div className="grid grid-cols-12 gap-0">
          {/* Mini barre latérale */}
          <div className="col-span-3 hidden space-y-1 border-r bg-surface p-3 md:block">
            {["Tableau de bord", "Patients", "Résultats de labo", "Rendez-vous", "Notifications", "Workflows"].map((l, i) => (
              <div key={l} className={cn("flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px]", i === 0 ? "bg-background font-medium text-foreground shadow-card ring-1 ring-border" : "text-muted-foreground")}>
                <span className={cn("h-3 w-3 rounded", i === 0 ? "bg-primary/70" : "bg-muted-foreground/25")} />
                {l}
              </div>
            ))}
          </div>
          <div className="col-span-12 space-y-3 p-4 md:col-span-9">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Patients suivis", "128", "bg-primary/15"],
                ["Rendez-vous", "24", "bg-info/15"],
                ["Alertes", "7", "bg-destructive/15"],
                ["Analyses", "1 204", "bg-chart-3/15"],
              ].map(([label, value, tone]) => (
                <div key={label} className="rounded-lg border bg-background p-3">
                  <span className={cn("block h-5 w-5 rounded-md", tone)} />
                  <p className="mt-2 text-[10px] text-muted-foreground">{label}</p>
                  <p className="tabular text-lg font-semibold leading-tight">{value}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-5">
              <div className="rounded-lg border bg-background p-3 sm:col-span-3">
                <p className="text-[11px] font-medium">Tendance du DFG moyen</p>
                <svg viewBox="0 0 300 90" className="mt-2 h-24 w-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="lp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[22, 45, 68].map((y) => <line key={y} x1="0" x2="300" y1={y} y2={y} stroke="hsl(var(--border))" strokeDasharray="3 3" />)}
                  <path d="M0 30 C 40 26, 60 40, 100 36 S 160 44, 200 50 S 260 58, 300 62 L300 90 L0 90Z" fill="url(#lp)" />
                  <path d="M0 30 C 40 26, 60 40, 100 36 S 160 44, 200 50 S 260 58, 300 62" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
                </svg>
              </div>
              <div className="space-y-2 rounded-lg border bg-background p-3 sm:col-span-2">
                <p className="text-[11px] font-medium">Stades MRC</p>
                {STAGES.map((s, i) => (
                  <div key={s.stage} className="flex items-center gap-2">
                    <span className="w-7 text-[10px] text-muted-foreground">{s.stage}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className={cn("h-full rounded-full", s.color)} style={{ width: `${[30, 55, 75, 45, 25, 12][i]}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden gap-3 sm:grid sm:grid-cols-3">
              {bars.slice(0, 3).map((v, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border bg-background p-2.5">
                  <span className="h-6 w-6 rounded-md bg-muted" />
                  <div className="flex-1 space-y-1">
                    <span className="block h-1.5 w-2/3 rounded bg-muted-foreground/25" />
                    <span className="block h-1.5 w-1/3 rounded bg-muted-foreground/15" />
                  </div>
                  <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-medium", i === 1 ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success")}>
                    {i === 1 ? "Élevé" : "Normal"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}

function BentoCard({ className, icon, title, description, children }: { className?: string; icon: React.ReactNode; title: string; description: string; children?: React.ReactNode }) {
  return (
    <motion.div
      {...fadeUp}
      className={cn("group relative flex flex-col overflow-hidden rounded-2xl border bg-card p-6 shadow-card transition-colors hover:border-foreground/15", className)}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(400px_circle_at_0%_0%,hsl(var(--primary)/0.08),transparent_60%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/20 [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </div>
      <h3 className="relative mt-5 text-base font-semibold">{title}</h3>
      <p className="relative mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
      {children && <div className="relative mt-6 flex-1">{children}</div>}
    </motion.div>
  );
}

export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();
  const ctaHref = isAuthenticated ? (user?.role === "admin" ? "/admin/dashboard" : "/dashboard") : "/login";

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <Navbar />

      {/* Héros */}
      <section className="relative px-4 pb-10 pt-36 sm:pt-44">
        <div className="bg-grid mask-radial absolute inset-0 -z-10" />
        <div className="absolute left-1/2 top-0 -z-10 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />

        <div className="mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <a href="#fonctionnalites" className="group inline-flex items-center gap-2 rounded-full border bg-background/80 py-1 pl-1 pr-3 text-xs font-medium shadow-xs backdrop-blur transition-colors hover:bg-accent">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">Nouveau</span>
              Assistant IA spécialisé en néphrologie
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </a>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="mt-7 text-balance text-4xl font-semibold tracking-tighter sm:text-6xl md:text-7xl"
          >
            <span className="text-gradient">Le suivi de la maladie rénale,</span>{" "}
            <span className="text-gradient-primary">enfin centralisé.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-6 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg"
          >
            CKD Care réunit dossiers patients, résultats de laboratoire, alertes et rendez-vous dans un seul espace.
            Le DFG est calculé automatiquement et chaque patient est classé selon les stades KDIGO.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button asChild size="lg" className="glow-primary w-full sm:w-auto">
              <Link href={ctaHref}>
                {isAuthenticated ? "Accéder au tableau de bord" : "Se connecter"} <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <a href="#fonctionnalites">Découvrir les fonctionnalités</a>
            </Button>
          </motion.div>
          <p className="mt-4 text-xs text-muted-foreground">Accès réservé aux médecins enregistrés par l'administrateur de la plateforme</p>
        </div>

        <ProductPreview />
      </section>

      {/* Bandeau de capacités */}
      <section className="border-y bg-surface py-5">
        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="flex w-max animate-marquee gap-6">
            {[...CAPABILITIES, ...CAPABILITIES].map((c, i) => (
              <span key={i} className="flex items-center gap-2 whitespace-nowrap text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-primary" /> {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Fonctionnalités (bento) */}
      <section id="fonctionnalites" className="scroll-mt-24 px-4 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium text-primary">Fonctionnalités</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Tout le parcours MRC, au même endroit</h2>
            <p className="mt-4 text-muted-foreground">Pensé avec des professionnels de santé pour réduire la charge administrative et ne rater aucun signal.</p>
          </motion.div>

          <div className="mt-14 grid gap-4 md:grid-cols-6">
            <BentoCard
              className="md:col-span-4"
              icon={<Calculator />}
              title="Calcul automatique du DFG"
              description="Saisissez une créatinine : le DFG est estimé (formule MDRD), enregistré et le stade du patient est mis à jour instantanément."
            >
              <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-surface p-4 font-mono text-xs">
                <span className="rounded-md border bg-background px-2.5 py-1.5">Créatinine 2,1 mg/dL</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className="rounded-md border bg-background px-2.5 py-1.5">DFG 38 mL/min/1.73m²</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className="inline-flex items-center gap-1.5 rounded-md border border-stage-3b/25 bg-stage-3b/10 px-2.5 py-1.5 text-stage-3b">
                  <span className="h-1.5 w-1.5 rounded-full bg-stage-3b" /> Stade 3B
                </span>
              </div>
            </BentoCard>

            <BentoCard
              className="md:col-span-2"
              icon={<Bell />}
              title="Alertes intelligentes"
              description="Chaque résultat est comparé aux normes : les valeurs critiques remontent en priorité."
            >
              <div className="space-y-2">
                {[
                  ["Potassium 6,1 mmol/L", "Critique", "bg-destructive"],
                  ["Changement de stade : 3B", "Attention", "bg-warning"],
                ].map(([m, s, dot]) => (
                  <div key={m} className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs shadow-xs">
                    <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
                    <span className="flex-1 truncate">{m}</span>
                    <span className="text-muted-foreground">{s}</span>
                  </div>
                ))}
              </div>
            </BentoCard>

            <BentoCard className="md:col-span-2" icon={<GitBranch />} title="Workflows par stade" description="Définissez des protocoles de suivi (tests, fréquence, seuils) appliqués aux patients du stade concerné." />
            <BentoCard className="md:col-span-2" icon={<FileText />} title="Rapports PDF" description="Générez un rapport complet du patient : informations, historique biologique et rendez-vous." />
            <BentoCard className="md:col-span-2" icon={<CalendarCheck />} title="Rendez-vous & rappels" description="Planifiez les consultations ; le patient reçoit une confirmation par e-mail." />

            <BentoCard
              className="md:col-span-3"
              icon={<Sparkles />}
              title="Assistant IA en néphrologie"
              description="Posez vos questions cliniques à un assistant spécialisé, directement depuis l'application."
            >
              <div className="space-y-2 text-xs">
                <div className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-md bg-primary px-3 py-2 text-primary-foreground">Objectifs tensionnels en MRC stade 3 ?</div>
                <div className="w-fit max-w-[85%] rounded-2xl rounded-bl-md border bg-background px-3 py-2 text-muted-foreground">
                  Les recommandations KDIGO visent généralement une pression systolique inférieure à 120 mmHg si elle est tolérée…
                </div>
              </div>
            </BentoCard>

            <BentoCard
              className="md:col-span-3"
              icon={<ShieldCheck />}
              title="Sécurisé et cloisonné"
              description="Chaque médecin n'accède qu'à ses propres patients. Mots de passe chiffrés, sessions sécurisées, espace d'administration dédié."
            >
              <div className="flex flex-wrap gap-2">
                {["Accès par rôle", "Sessions sécurisées", "Mots de passe chiffrés (bcrypt)", "Données hébergées sur PostgreSQL"].map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
                    <Check className="h-3 w-3 text-primary" /> {t}
                  </span>
                ))}
              </div>
            </BentoCard>
          </div>
        </div>
      </section>

      {/* Stades MRC */}
      <section id="stades" className="scroll-mt-24 border-y bg-surface px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="max-w-2xl">
            <p className="text-sm font-medium text-primary">Classification KDIGO</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Six stades, un suivi adapté à chacun</h2>
            <p className="mt-4 text-muted-foreground">
              Le stade est déterminé à partir du débit de filtration glomérulaire (mL/min/1.73m²). CKD Care le recalcule à chaque nouvelle créatinine.
            </p>
          </motion.div>

          <motion.div {...fadeUp} className="mt-12">
            <div className="flex h-2 overflow-hidden rounded-full">
              {STAGES.map((s) => <div key={s.stage} className={cn("flex-1", s.color)} />)}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {STAGES.map((s) => (
                <div key={s.stage} className="rounded-xl border bg-card p-4 shadow-card">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", s.color)} />
                    <span className="text-sm font-semibold">Stade {s.stage}</span>
                  </div>
                  <p className="tabular mt-3 text-xl font-semibold tracking-tight">{s.range}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Fonctionnement */}
      <section id="fonctionnement" className="scroll-mt-24 px-4 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium text-primary">Fonctionnement</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Opérationnel en trois étapes</h2>
          </motion.div>
          <div className="relative mt-14 grid gap-6 md:grid-cols-3">
            <div className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block" />
            {[
              { icon: <Stethoscope />, title: "Recevez vos accès", text: "L'administrateur crée votre compte médecin : vos identifiants vous parviennent par e-mail." },
              { icon: <UserPlus />, title: "Ajoutez vos patients", text: "Renseignez les dossiers et saisissez les analyses : DFG et stade sont calculés pour vous." },
              { icon: <Activity />, title: "Suivez l'évolution", text: "Tendances, alertes critiques et rendez-vous : tout est réuni sur votre tableau de bord." },
            ].map((step, i) => (
              <motion.div key={step.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.1 }} className="relative text-center">
                <div className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border bg-card text-primary shadow-card [&_svg]:h-5 [&_svg]:w-5">
                  {step.icon}
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">{i + 1}</span>
                </div>
                <h3 className="mt-5 font-semibold">{step.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">{step.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Appel à l'action */}
      <section className="px-4 pb-24">
        <motion.div {...fadeUp} className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border bg-card px-6 py-16 text-center shadow-float sm:px-16">
          <div className="bg-grid mask-radial-center absolute inset-0 opacity-70" />
          <div className="absolute -top-24 left-1/2 h-64 w-[600px] -translate-x-1/2 rounded-full bg-primary/20 blur-[100px]" />
          <div className="relative">
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Vous avez reçu vos identifiants ?</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">Connectez-vous avec l'adresse e-mail et le mot de passe reçus, puis personnalisez votre mot de passe dans les paramètres. Pas encore de compte ? Rapprochez-vous de l'administrateur de votre établissement.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="glow-primary">
                <Link href={ctaHref}>{isAuthenticated ? "Accéder au tableau de bord" : "Se connecter"} <ArrowRight /></Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      <footer className="border-t px-4 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <Logo />
            <p className="max-w-sm text-sm text-muted-foreground">
              Plateforme développée dans le cadre du hackathon inter-spécialités IFRI / UAC.
            </p>
          </div>
          {/* <div className="text-sm text-muted-foreground sm:text-right">
            <p className="font-medium text-foreground">Équipe</p>
            <p className="mt-2 max-w-md">SANNI Charbel · AKPACHEME Bill · COMADOU Syldon · ADETOUTOU Karel Pio-Marie · SOULE CHABI Ryad</p>
          </div> */}
        </div>
        <p className="mx-auto mt-8 max-w-6xl text-xs text-muted-foreground">
          © {new Date().getFullYear()} CKD Care. Outil d'aide au suivi, il ne remplace pas le jugement clinique.
        </p>
      </footer>
    </div>
  );
}
