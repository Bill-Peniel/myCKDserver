import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, Search, Filter, Calendar, Check, X, Trash2,
  Calendar as CalendarIcon, FileText 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AvatarName } from '@/components/ui/avatar-name';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Loader } from '@/components/ui/loader';
import { Appointment, Patient, Doctor } from '@/lib/types';
import { formatDate, formatTime } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';


export default function AppointmentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const appointmentsPerPage = 10;

  const { data: appointments, isLoading: appointmentsLoading } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments'],
  });

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
  });

  const { data: doctors } = useQuery<Doctor[]>({
    queryKey: ['/api/doctors'],
  });

  const getPatient = (patientId: string) => {
    return patients?.find(p => p._id === patientId);
  };

  const getDoctor = (doctorId: string) => {
    return doctors?.find(d => d._id === doctorId);
  };

  // Update appointment status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      return apiRequest('PUT', `/api/appointments/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: 'Status updated',
        description: 'The appointment status has been updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update status',
        variant: 'destructive',
      });
    }
  });

  const handleStatusChange = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  // Delete appointment mutation
  const deleteAppointmentMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/appointments/${id}`);
    },
    onSuccess: () => {
      // Rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/upcoming-appointments'] });

      toast({
        title: 'Succès',
        description: 'Le rendez-vous a été supprimé avec succès',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Échec de la suppression du rendez-vous',
        variant: 'destructive',
      });
    },
  });


  // Filter appointments based on search and filter
  const filteredAppointments = appointments?.filter(appointment => {
    const patient = appointment.patient;
    const doctor = appointment.doctor;
    const searchLower = searchQuery.toLowerCase();

    const matchesSearch = searchQuery === '' ? true : (
      patient && (
        patient.user.firstName.toLowerCase().includes(searchLower) ||
        patient.user.lastName.toLowerCase().includes(searchLower)
      ) ||
      doctor && (
        doctor.user.firstName.toLowerCase().includes(searchLower) ||
        doctor.user.lastName.toLowerCase().includes(searchLower)
      ) ||
      appointment.purpose?.toLowerCase().includes(searchLower)
    );

    const matchesFilter = filterStatus === 'all' ? true : appointment.doctorStatus === filterStatus;

    return matchesSearch && matchesFilter;
  }) || [];

  // Sort by date (newest first)
  const sortedAppointments = [...filteredAppointments].sort(
    (a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()
  );

  // Calculate pagination
  const totalPages = Math.ceil(sortedAppointments.length / appointmentsPerPage);
  const startIndex = (currentPage - 1) * appointmentsPerPage;
  const paginatedAppointments = sortedAppointments.slice(startIndex, startIndex + appointmentsPerPage);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Reset to first page when searching
    setCurrentPage(1);
  };

  const deleteAppointment = (id: string) => {
    deleteAppointmentMutation.mutate(id);
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Rendez-vous</h1>
        <Link href="/appointments/add">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Planifier un rendez-vous</span>
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Calendrier des rendez-vous</CardTitle>
              <CardDescription>
                Afficher et gérer tous les rendez-vous planifiés
              </CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <form onSubmit={handleSearch} className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Rechercher des patients ou des médecins..."
                  className="pl-8 w-full sm:w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select
                  value={filterStatus}
                  onValueChange={setFilterStatus}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="pending">En cours</SelectItem>
                    <SelectItem value="completed">Terminé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {appointmentsLoading ? (
            <div className="h-96 flex items-center justify-center">
              <Loader size="lg" />
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center text-gray-500">
              <CalendarIcon className="h-12 w-12 mb-4" />
              <h3 className="text-lg font-medium">Aucun rendez-vous trouvé</h3>
              <p className="text-sm">Essayez d'ajuster vos critères de recherche ou de filtrage</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Heure</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Médecin</TableHead>
                      <TableHead>Objet</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAppointments.map((appointment) => {
                      const patient = appointment.patient; //Updated
                      const doctor = appointment.doctor; //Updated
                      const isUpcoming = new Date(appointment.appointmentDate) >= new Date();
                      const isPending = appointment.doctorStatus === 'pending';
                      const isConfirmed = appointment.doctorStatus === 'confirmed';
                      return (
                        <TableRow key={appointment._id}>
                          <TableCell>
                            {formatDate(appointment.appointmentDate)} {formatTime(appointment.appointmentDate)}
                          </TableCell>
                          <TableCell>
                            {patient ? (
                              <Link href={`/patients/${patient._id}`}>
                                <AvatarName
                                  firstName={patient.user.firstName}
                                  lastName={patient.user.lastName}
                                  className="cursor-pointer hover:opacity-80"
                                />
                              </Link>
                            ) : (
                              <span className="text-gray-500">Patient inconnu</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {doctor ? (
                              <div>
                                <div className="font-medium">Dr. {doctor.user.firstName} {doctor.user.lastName}</div>
                                <div className="text-gray-500 text-sm">{doctor.specialty}</div>
                              </div>
                            ) : (
                              <span className="text-gray-500">Docteur inconnu</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {appointment.purpose || 'Consultation générale'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              appointment.doctorStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              appointment.doctorStatus === 'confirmed' ? 'bg-green-100 text-green-800' :
                              appointment.doctorStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                              appointment.doctorStatus === 'completed' ? 'bg-blue-100 text-blue-800' :
                              ''
                            }>
                              {appointment.doctorStatus === 'pending' ? 'En attente' :
                               appointment.doctorStatus === 'confirmed' ? 'Confirmé' :
                               appointment.doctorStatus === 'cancelled' ? 'Annulé' :
                               appointment.doctorStatus === 'completed' ? 'Terminé' :
                               appointment.doctorStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Supprimer
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Êtes-vous sûr de vouloir supprimer ce rendez-vous ? Cette action ne peut pas être annulée.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => deleteAppointmentMutation.mutate(appointment._id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Supprimer
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-500">
                    Affichage de {startIndex + 1} à {Math.min(startIndex + appointmentsPerPage, filteredAppointments.length)} sur {filteredAppointments.length} rendez-vous
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>

                      {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                        const page = i + 1;
                        return (
                          <PaginationItem key={i}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}

                      {totalPages > 5 && currentPage < totalPages - 2 && (
                        <PaginationItem>
                          <span className="flex h-9 w-9 items-center justify-center">...</span>
                        </PaginationItem>
                      )}

                      {totalPages > 5 && (
                        <PaginationItem>
                          <PaginationLink
                            onClick={() => setCurrentPage(totalPages)}
                            isActive={currentPage === totalPages}
                          >
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      )}

                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}