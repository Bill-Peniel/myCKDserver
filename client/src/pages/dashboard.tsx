import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Users, Calendar, FileText, AlertTriangle, Settings, Plus } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/stats-card';
import { ChartCard } from '@/components/dashboard/chart-card';

import { LabResultsList } from '@/components/dashboard/appointments-list';
import { AlertsList } from '@/components/dashboard/alerts-list';
import { Button } from '@/components/ui/button';
import { WorkflowModal } from '@/components/dashboard/workflow-modal';
import { Loader } from '@/components/ui/loader';
import { DashboardStats, Patient, Appointment, Alert } from '@/lib/types';

export default function Dashboard() {
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);
  const [period, setPeriod] = useState('3M');

  const { data: dashboardStats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    refetchInterval: 5000, // Rafraîchit toutes les 5 secondes
  });

  const { data: notificationsData, isLoading: notificationsLoading } = useQuery<{ notifications: any[], criticalCount: number }>({
    queryKey: ['/api/notifications'],
    refetchInterval: 5000,
  });

  const { data: upcomingAppointments, isLoading: appointmentsLoading, error: appointmentsError } = useQuery<Appointment[]>({
    queryKey: ['/api/dashboard/upcoming-appointments'],
    refetchInterval: 5000,
    onSuccess: (data) => console.log("Appointments fetched successfully:", data),
    onError: (error) => console.error("Error fetching appointments:", error)
  });

  const { data: labResults } = useQuery<any[]>({
    queryKey: ['/api/patient-lab-results'],
    refetchInterval: 5000,
  });

  // Calculer les données de tendance DFG
  const [startDate, setStartDate] = useState<string>(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    const [endDate, setEndDate] = useState<string>(
      new Date().toISOString().split('T')[0]
    );

    const [selectedPeriod, setSelectedPeriod] = useState({ startDate, endDate });

const dfgTrendData = useMemo(() => {
    if (!labResults || !selectedPeriod.startDate || !selectedPeriod.endDate) return [];

    const dfgResults = labResults.filter(result => 
      result.labTest?.testName?.toLowerCase().includes('dfg')
    );

    const start = new Date(selectedPeriod.startDate);
    const end = new Date(selectedPeriod.endDate);

    // Filtrer les résultats par période
    const filteredResults = dfgResults
      .filter(result => {
        const resultDate = new Date(result.resultDate);
        return resultDate >= start && resultDate <= end;
      })
      .sort((a, b) => new Date(a.resultDate).getTime() - new Date(b.resultDate).getTime());

    return filteredResults.map(result => ({
      month: new Date(result.resultDate).toLocaleDateString(),
      value: result.resultValue
    }));
  }, [labResults, selectedPeriod]);

const handlePeriodChange = (period: { startDate?: string; endDate?: string }) => {
  setStartDate(period.startDate || startDate);
  setEndDate(period.endDate || endDate);
};

const handlePeriodValidation = () => {
  setSelectedPeriod({ startDate, endDate });
};

  if (statsLoading || appointmentsLoading || notificationsLoading) {
    return (
      <div className="flex flex-col space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <div className="h-96 flex items-center justify-center">
          <Loader size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <Button 
          onClick={() => setWorkflowModalOpen(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Créer un Workflow</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          icon={<User className="text-black h-6 w-6" />}
          iconBgColor="bg-white"
          title="Total Patients"
          value={dashboardStats?.totalPatients || 0}
          footerLink="/patients"
          footerText="Voir tous les patients"
          footerLinkColor="text-primary hover:text-primary-dark"
        />

        <StatsCard
          icon={<Calendar className="h-6 w-6 text-white" />}
          iconBgColor="bg-indigo-500"
          title="Rendez-vous total"
          value={dashboardStats?.totalAppointments || 0}
          footerLink="/appointments"
          footerText="Voir tous les rendez-vous"
          footerLinkColor="text-indigo-600 hover:text-indigo-500"
        />

        <StatsCard
          icon={<AlertTriangle className="h-6 w-6 text-white" />}
          iconBgColor="bg-yellow-500"
          title="Notifications non lues"
          value={notificationsData?.notifications?.filter(n => !n.isRead)?.length || 0}
          footerLink="/notifications"
          footerText="Voir toutes les alertes"
          footerLinkColor="text-yellow-600 hover:text-yellow-500"
        />

        <StatsCard
          icon={<FileText className="h-6 w-6 text-white" />}
          iconBgColor="bg-green-500"
          title="Résultats de laboratoire"
          value={labResults?.length || 0}
          footerLink="/lab-results"
          footerText="Voir tous les résultats"
          footerLinkColor="text-green-600 hover:text-green-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard
          title="Distribution des stades MRC des patients"
          type="pie"
          data={dashboardStats?.stageDistribution || {}}
        />

        <ChartCard
          title="Tendance moyenne du DFG"
          type="line"
          data={dfgTrendData}
          period={{ startDate, endDate }}
          onPeriodChange={handlePeriodChange}
          onPeriodValidate={handlePeriodValidation}
        />
      </div>



      {/* Appointments and Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LabResultsList />
        <AlertsList notifications={notificationsData?.notifications?.slice(0, 5) || []} />
      </div>

      {/* Workflow Modal */}
      <WorkflowModal 
        isOpen={workflowModalOpen} 
        onClose={() => setWorkflowModalOpen(false)} 
      />
    </div>
  );
}