import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarDays,
  FlaskConical,
  LogOut,
  ShieldCheck,
  Stethoscope,
  UserCog,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { EmptyState, PageHeader, StatCard } from '@/components/kit';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { cn, getCKDStageColor, getCKDStageLabel } from '@/lib/utils';

const STAGES = ['Stage 1', 'Stage 2', 'Stage 3A', 'Stage 3B', 'Stage 4', 'Stage 5'];

function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-14 w-80" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[138px] rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <Skeleton className="h-80 rounded-xl lg:col-span-3" />
        <Skeleton className="h-80 rounded-xl lg:col-span-2" />
      </div>
    </div>
  );
}

function StageDistribution({ data }: { data: { _id: string | null; count: number }[] }) {
  const counts = new Map<string, number>();
  let unknown = 0;
  for (const row of data) {
    if (row._id && STAGES.includes(row._id)) counts.set(row._id, (counts.get(row._id) ?? 0) + Number(row.count));
    else unknown += Number(row.count);
  }
  const total = data.reduce((sum, r) => sum + Number(r.count), 0);
  const max = Math.max(1, ...Array.from(counts.values()), unknown);
  const rows = STAGES.map((stage) => ({ stage, count: counts.get(stage) ?? 0 }));
  const sum = (...stages: string[]) => stages.reduce((n, st) => n + (counts.get(st) ?? 0), 0);
  const groups = [
    { label: 'Précoces (1–2)', count: sum('Stage 1', 'Stage 2') },
    { label: 'Modérés (3A–3B)', count: sum('Stage 3A', 'Stage 3B') },
    { label: 'Avancés (4–5)', count: sum('Stage 4', 'Stage 5') },
  ];

  return (
    <Card className="lg:col-span-3">
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle>Répartition par stade</CardTitle>
          <CardDescription>Patients selon le stade de la maladie rénale chronique</CardDescription>
        </div>
        <div className="text-right">
          <p className="tabular text-xl font-semibold leading-none tracking-tight">{total}</p>
          <p className="mt-1 text-xs text-muted-foreground">patients</p>
        </div>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <EmptyState compact icon={<Users />} title="Aucun patient" description="La répartition apparaîtra dès le premier dossier créé." />
        ) : (
          <ul className="space-y-3.5">
            {rows.map(({ stage, count }) => {
              const c = getCKDStageColor(stage);
              const pct = total ? Math.round((count / total) * 100) : 0;
              return (
                <li key={stage} className="grid grid-cols-[84px_1fr_64px] items-center gap-3">
                  <span className="flex items-center gap-2 text-[13px] font-medium">
                    <span className={cn('h-2 w-2 rounded-full', c.dot)} />
                    {getCKDStageLabel(stage)}
                  </span>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', c.dot)}
                      style={{ width: `${(count / max) * 100}%` }}
                    />
                  </div>
                  <span className="tabular text-right text-[13px]">
                    <span className="font-semibold">{count}</span>
                    <span className="ml-1.5 text-xs text-muted-foreground">{pct}%</span>
                  </span>
                </li>
              );
            })}
            {unknown > 0 && (
              <li className="grid grid-cols-[84px_1fr_64px] items-center gap-3">
                <span className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                  Non défini
                </span>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-muted-foreground/60" style={{ width: `${(unknown / max) * 100}%` }} />
                </div>
                <span className="tabular text-right text-[13px] font-semibold">{unknown}</span>
              </li>
            )}
          </ul>
        )}
        {total > 0 && (
          <div className="mt-6 grid grid-cols-3 divide-x rounded-lg border bg-muted/40">
            {groups.map((g) => (
              <div key={g.label} className="px-3 py-2.5">
                <p className="truncate text-xs text-muted-foreground">{g.label}</p>
                <p className="tabular mt-0.5 text-base font-semibold tracking-tight">
                  {g.count}
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                    {Math.round((g.count / total) * 100)}%
                  </span>
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickLink({ href, icon, title, description }: { href: string; icon: React.ReactNode; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-lg border bg-background p-3 transition-all hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-float"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20 [&_svg]:h-[18px] [&_svg]:w-[18px]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{description}</span>
      </span>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
    </Link>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Déconnexion réussie"
      });
    } catch (error) {
      toast({
        title: "Erreur lors de la déconnexion",
        variant: "destructive"
      });
    }
  };

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/stats');
      const json = await response.json();
      return json;
    },
    enabled: user?.role === 'admin',
    staleTime: 30000
  });

  if (!user || user.role !== 'admin') {
    return (
      <EmptyState
        icon={<ShieldCheck />}
        title="Accès non autorisé"
        description="Cette section est réservée aux administrateurs."
      />
    );
  }

  if (isLoadingStats) {
    return <AdminDashboardSkeleton />;
  }

  const totalDoctors = Number(stats?.totalDoctors ?? 0);
  const totalPatients = Number(stats?.totalPatients ?? 0);
  const ratio = totalDoctors > 0 ? (totalPatients / totalDoctors).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) : '—';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Vue d'ensemble"
        description="Activité globale de la plateforme CKD Care."
        actions={
          <>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut /> Se déconnecter
            </Button>
            <Button asChild>
              <Link href="/admin/doctors"><Stethoscope /> Gérer les médecins</Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Médecins" value={totalDoctors} icon={<Stethoscope />} tone="primary" hint="Comptes praticiens" href="/admin/doctors" />
        <StatCard label="Patients" value={totalPatients} icon={<Users />} tone="info" hint="Dossiers enregistrés" href="/admin/patients" />
        <StatCard label="Utilisateurs" value={stats?.totalUsers ?? 0} icon={<UserCog />} tone="violet" hint="Tous rôles confondus" />
        <StatCard label="Rendez-vous" value={stats?.totalAppointments ?? 0} icon={<CalendarDays />} tone="warning" hint="Consultations planifiées" />
        <StatCard label="Résultats de labo" value={stats?.totalLabResults ?? 0} icon={<FlaskConical />} tone="success" hint="Analyses saisies" className="col-span-2 sm:col-span-1" />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <StageDistribution data={stats?.patientsByStage ?? []} />

        <Card className="flex flex-col lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle>Gestion</CardTitle>
            <CardDescription>Accès rapide aux annuaires</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Patients par médecin</p>
                <p className="tabular mt-1 text-xl font-semibold tracking-tight">{ratio}</p>
              </div>
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Analyses par patient</p>
                <p className="tabular mt-1 text-xl font-semibold tracking-tight">
                  {totalPatients > 0
                    ? (Number(stats?.totalLabResults ?? 0) / totalPatients).toLocaleString('fr-FR', { maximumFractionDigits: 1 })
                    : '—'}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <QuickLink href="/admin/doctors" icon={<Stethoscope />} title="Médecins" description="Créer, modifier ou retirer un praticien" />
              <QuickLink href="/admin/patients" icon={<Users />} title="Patients" description="Dossiers, stades et médecins référents" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
