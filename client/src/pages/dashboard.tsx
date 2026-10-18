import { useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CalendarDays, FlaskConical, Plus, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader, StatCard } from '@/components/kit';
import { StageChart } from '@/components/dashboard/stage-chart';
import { DfgTrendChart } from '@/components/dashboard/dfg-trend-chart';
import { RecentAlerts, RecentLabResults, UpcomingAppointments } from '@/components/dashboard/activity-lists';
import { WorkflowModal } from '@/components/dashboard/workflow-modal';
import { useAuth } from '@/hooks/use-auth';
import { DashboardStats } from '@/lib/types';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-14 w-72" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[138px] rounded-xl" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <Skeleton className="h-80 rounded-xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-xl lg:col-span-3" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats & { totalAppointments: number }>({
    queryKey: ['/api/dashboard/stats'],
    refetchInterval: 15000,
  });

  const { data: notificationsData, isLoading: notificationsLoading } = useQuery<{ notifications: any[]; criticalCount: number }>({
    queryKey: ['/api/notifications'],
    refetchInterval: 15000,
  });

  const { data: upcomingAppointments = [] } = useQuery<any[]>({
    queryKey: ['/api/dashboard/upcoming-appointments'],
    refetchInterval: 30000,
  });

  const { data: labResults = [] } = useQuery<any[]>({
    queryKey: ['/api/patient-lab-results'],
    refetchInterval: 15000,
  });

  if (statsLoading || notificationsLoading) {
    return <DashboardSkeleton />;
  }

  const notifications = notificationsData?.notifications ?? [];
  const unread = notifications.filter((n) => !n.isRead).length;
  const critical = notificationsData?.criticalCount ?? 0;
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={today}
        title={`${greeting()}, Dr. ${user?.lastName ?? ''}`}
        description="Voici l'état de vos patients aujourd'hui."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/patients/add"><UserPlus /> Nouveau patient</Link>
            </Button>
            <Button onClick={() => setWorkflowModalOpen(true)}>
              <Plus /> Créer un workflow
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="Patients suivis"
          value={stats?.totalPatients ?? 0}
          icon={<Users />}
          tone="primary"
          hint="Dossiers actifs"
          href="/patients"
        />
        <StatCard
          label="Rendez-vous à venir"
          value={stats?.upcomingAppointments ?? 0}
          icon={<CalendarDays />}
          tone="info"
          hint={`${stats?.totalAppointments ?? 0} au total`}
          href="/appointments"
        />
        <StatCard
          label="Alertes non lues"
          value={unread}
          icon={<AlertTriangle />}
          tone={critical > 0 ? 'destructive' : 'warning'}
          hint={critical > 0 ? `${critical} critique${critical > 1 ? 's' : ''} à traiter` : 'Aucune alerte critique'}
          href="/notifications"
        />
        <StatCard
          label="Résultats de labo"
          value={labResults.length}
          icon={<FlaskConical />}
          tone="violet"
          hint="Analyses enregistrées"
          href="/lab-results"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <StageChart data={stats?.stageDistribution ?? {}} className="lg:col-span-2" />
        <DfgTrendChart labResults={labResults} className="lg:col-span-3" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RecentLabResults labResults={labResults} />
        <RecentAlerts notifications={notifications} />
        <UpcomingAppointments appointments={upcomingAppointments} />
      </div>

      <WorkflowModal isOpen={workflowModalOpen} onClose={() => setWorkflowModalOpen(false)} />
    </div>
  );
}
