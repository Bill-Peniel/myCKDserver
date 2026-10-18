import { Link } from "wouter";
import { ArrowLeft, Compass, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/kit";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-background">
      {/* Fond : grille fine estompée + halo d'accent */}
      <div className="pointer-events-none absolute inset-0 bg-grid mask-radial-center" aria-hidden />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />

      <header className="relative z-10 flex items-center justify-between px-4 py-5 sm:px-8">
        <Link href="/" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Logo />
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-24">
        <div className="flex max-w-md flex-col items-center text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-card backdrop-blur">
            <Compass className="h-3.5 w-3.5 text-primary" />
            Erreur 404
          </span>

          <h1 className="text-gradient-primary mt-6 select-none text-[112px] font-semibold leading-none tracking-tighter sm:text-[160px]">
            404
          </h1>

          <h2 className="mt-4 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Page introuvable
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            La page que vous cherchez n'existe pas, a été déplacée ou n'est plus disponible.
          </p>

          <div className="mt-8 flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft /> Page précédente
            </Button>
            <Button asChild>
              <Link href="/dashboard">
                <LayoutDashboard /> Retour au tableau de bord
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
