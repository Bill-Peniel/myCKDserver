
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Calendar, AlertTriangle, FileText, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader } from '@/components/ui/loader';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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
    return <div>Accès non autorisé</div>;
  }

  if (isLoadingStats) {
    return (
      <div className="flex flex-col space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard Administrateur</h1>
        <div className="h-96 flex items-center justify-center">
          <Loader size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord administrateur</h1>
        <Button onClick={handleLogout} variant="destructive" className="flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </Button>
      </div>
      
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600">Total Médecins</CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.totalDoctors || '0'}</div>
            <p className="text-sm text-gray-500 mt-1">Médecins enregistrés</p>
          </CardContent>
        </Card>

        <Card className="bg-white hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600">Total Patients</CardTitle>
            <Users className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.totalPatients || '0'}</div>
            <p className="text-sm text-gray-500 mt-1">Patients suivis</p>
          </CardContent>
        </Card>

        <Card className="bg-white hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600">Total Rendez-vous</CardTitle>
            <Calendar className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.totalAppointments || '0'}</div>
            <p className="text-sm text-gray-500 mt-1">Consultations planifiées</p>
          </CardContent>
        </Card>

        <Card className="bg-white hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600">Résultats Labo</CardTitle>
            <FileText className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.totalLabResults || '0'}</div>
            <p className="text-sm text-gray-500 mt-1">Résultats de laboratoire</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Distribution des patients par stade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {stats?.patientsByStage?.map((stage: any) => (
              <div key={stage._id} className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                <div className="text-sm text-gray-600">Stade {stage._id || 'N/A'}</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">{stage.count}</div>
              </div>
            )) || []}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
