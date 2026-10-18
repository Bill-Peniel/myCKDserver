import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import {
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Hourglass,
  MoreHorizontal,
  Plus,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState, PageHeader, SearchInput, StageBadge, StatCard, StatusBadge, UserAvatar } from '@/components/kit';
import AddAppointmentDialog from '@/components/appointments/add-dialog';
import { cn, formatTime } from '@/lib/utils';
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
} from '@/components/ui/alert-dialog';

type Period = 'upcoming' | 'past' | 'all';

function DateBlock({ date, muted }: { date: Date; muted?: boolean }) {
  return (
    <div className={cn('flex w-11 shrink-0 flex-col items-center rounded-lg border bg-background py-1 shadow-xs', muted && 'opacity-60')}>
      <span className="text-[10px] font-medium uppercase text-primary">
        {date.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}
      </span>
      <span className="tabular text-base font-semibold leading-none">{date.getDate()}</span>
    </div>
  );
}

function relativeDay(date: Date) {
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((startOf(date) - startOf(new Date())) / 86400000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Demain';
  if (diff === -1) return 'Hier';
  if (diff > 1 && diff < 7) return `Dans ${diff} jours`;
  return date.toLocaleDateString('fr-FR', { weekday: 'long' });
}

function ListSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
          <Skeleton className="h-11 w-11 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="hidden h-4 w-32 md:block" />
          <Skeleton className="h-5 w-20 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export default function AppointmentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [period, setPeriod] = useState<Period>('upcoming');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const appointmentsPerPage = 10;

  const { data: appointments, isLoading: appointmentsLoading } = useQuery<any[]>({
    queryKey: ['/api/appointments'],
  });

  // Mise à jour du statut
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      return apiRequest('PUT', `/api/appointments/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: 'Statut mis à jour',
        description: 'Le statut du rendez-vous a été mis à jour avec succès',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Échec de la mise à jour du statut',
        variant: 'destructive',
      });
    }
  });

  const handleStatusChange = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  // Suppression
  const deleteAppointmentMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/appointments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/upcoming-appointments'] });

      toast({
        title: 'Rendez-vous supprimé',
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

  const now = new Date();
  const all = appointments ?? [];
  const isUpcoming = (a: any) => new Date(a.appointmentDate) >= now;
  const upcomingCount = all.filter(isUpcoming).length;
  const pastCount = all.length - upcomingCount;

  const weekEnd = new Date(now.getTime() + 7 * 86400000);
  const stats = {
    upcoming: all.filter((a) => isUpcoming(a) && a.doctorStatus !== 'cancelled').length,
    week: all.filter((a) => {
      const d = new Date(a.appointmentDate);
      return d >= now && d <= weekEnd && a.doctorStatus !== 'cancelled';
    }).length,
    pending: all.filter((a) => isUpcoming(a) && a.doctorStatus === 'pending').length,
    confirmed: all.filter((a) => isUpcoming(a) && a.doctorStatus === 'confirmed').length,
  };

  // Filtrage (recherche, statut, période)
  const filteredAppointments = all.filter(appointment => {
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
    const matchesPeriod = period === 'all' ? true : period === 'upcoming' ? isUpcoming(appointment) : !isUpcoming(appointment);

    return matchesSearch && matchesFilter && matchesPeriod;
  });

  // Tri chronologique (les passés : du plus récent au plus ancien)
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    const diff = new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime();
    return period === 'past' ? -diff : diff;
  });

  const totalPages = Math.ceil(sortedAppointments.length / appointmentsPerPage);
  const startIndex = (currentPage - 1) * appointmentsPerPage;
  const paginatedAppointments = sortedAppointments.slice(startIndex, startIndex + appointmentsPerPage);

  const deleteAppointment = (id: string) => {
    deleteAppointmentMutation.mutate(id);
  };

  const hasFilters = searchQuery !== '' || filterStatus !== 'all';
  const resetFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setCurrentPage(1);
  };

  const actions = (appointment: any) => (
    <RowActions
      status={appointment.doctorStatus}
      upcoming={isUpcoming(appointment)}
      patientHref={appointment.patient?._id ? `/patients/${appointment.patient._id}` : undefined}
      onConfirm={() => handleStatusChange(appointment._id, 'confirmed')}
      onCancel={() => handleStatusChange(appointment._id, 'cancelled')}
      onComplete={() => handleStatusChange(appointment._id, 'completed')}
      onDelete={() => setToDelete(appointment._id)}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rendez-vous"
        description="Planifiez et suivez les consultations de vos patients."
        actions={
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus /> Planifier un rendez-vous
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="À venir" value={stats.upcoming} icon={<CalendarDays />} tone="info" hint={`${all.length} au total`} />
        <StatCard label="Dans les 7 jours" value={stats.week} icon={<CalendarClock />} tone="primary" hint="Consultations de la semaine" />
        <StatCard
          label="En attente"
          value={stats.pending}
          icon={<Hourglass />}
          tone="warning"
          hint={stats.pending > 0 ? 'À confirmer' : 'Tout est confirmé'}
        />
        <StatCard label="Confirmés" value={stats.confirmed} icon={<CalendarCheck />} tone="success" hint="Rendez-vous à venir confirmés" />
      </div>

      <Card className="overflow-hidden">
        {/* Barre d'outils */}
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
          <Tabs
            value={period}
            onValueChange={(v) => {
              setPeriod(v as Period);
              setCurrentPage(1);
            }}
          >
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="upcoming" className="flex-1 gap-1.5 sm:flex-none">
                À venir <span className="tabular text-xs text-muted-foreground">{upcomingCount}</span>
              </TabsTrigger>
              <TabsTrigger value="past" className="flex-1 gap-1.5 sm:flex-none">
                Passés <span className="tabular text-xs text-muted-foreground">{pastCount}</span>
              </TabsTrigger>
              <TabsTrigger value="all" className="flex-1 gap-1.5 sm:flex-none">
                Tous <span className="tabular text-xs text-muted-foreground">{all.length}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex flex-col gap-3 sm:flex-row lg:ml-auto lg:items-center">
            <SearchInput
              placeholder="Rechercher un patient…"
              className="sm:w-[260px]"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            <Select
              value={filterStatus}
              onValueChange={(v) => {
                setFilterStatus(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="sm:w-[170px]">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="confirmed">Confirmé</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {appointmentsLoading ? (
          <ListSkeleton />
        ) : sortedAppointments.length === 0 ? (
          <EmptyState
            icon={<CalendarDays />}
            title={hasFilters ? 'Aucun rendez-vous trouvé' : period === 'past' ? 'Aucun rendez-vous passé' : 'Aucun rendez-vous à venir'}
            description={hasFilters ? "Essayez d'ajuster vos critères de recherche ou de filtrage." : 'Planifiez une consultation pour la voir apparaître ici.'}
            action={
              hasFilters ? (
                <Button variant="outline" onClick={resetFilters}>Réinitialiser les filtres</Button>
              ) : (
                <Button onClick={() => setIsDialogOpen(true)}><Plus /> Planifier un rendez-vous</Button>
              )
            }
          />
        ) : (
          <>
            {/* Vue tableau (≥ md) */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[190px]">Date</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Stade</TableHead>
                    <TableHead>Motif</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAppointments.map((appointment) => {
                    const d = new Date(appointment.appointmentDate);
                    const patient = appointment.patient;
                    const inactive = appointment.doctorStatus === 'cancelled' || !isUpcoming(appointment);
                    return (
                      <TableRow key={appointment._id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <DateBlock date={d} muted={inactive} />
                            <div className="min-w-0">
                              <p className="first-letter:uppercase text-[13px] font-medium">{relativeDay(d)}</p>
                              <p className="tabular flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" /> {formatTime(appointment.appointmentDate)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {patient ? (
                            <Link href={`/patients/${patient._id}`} className="group flex items-center gap-3">
                              <UserAvatar firstName={patient.user.firstName} lastName={patient.user.lastName} size="sm" />
                              <div className="min-w-0">
                                <p className="truncate font-medium group-hover:underline group-hover:underline-offset-4">
                                  {patient.user.firstName} {patient.user.lastName}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {patient.age ? `${patient.age} ans` : 'Patient'}
                                  {patient.phone ? ` · ${patient.phone}` : ''}
                                </p>
                              </div>
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">Patient inconnu</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {patient?.ckdStage ? <StageBadge stage={patient.ckdStage} /> : <span className="text-xs text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          <p className={cn('max-w-[280px] truncate', appointment.doctorStatus === 'cancelled' && 'text-muted-foreground line-through')}>
                            {appointment.purpose || 'Consultation générale'}
                          </p>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={appointment.doctorStatus} />
                        </TableCell>
                        <TableCell>{actions(appointment)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Vue liste (mobile) */}
            <ul className="divide-y md:hidden">
              {paginatedAppointments.map((appointment) => {
                const d = new Date(appointment.appointmentDate);
                const patient = appointment.patient;
                const inactive = appointment.doctorStatus === 'cancelled' || !isUpcoming(appointment);
                return (
                  <li key={appointment._id} className="flex items-start gap-3 px-4 py-3.5">
                    <DateBlock date={d} muted={inactive} />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="truncate text-sm font-medium">
                        {patient ? `${patient.user.firstName} ${patient.user.lastName}` : 'Patient inconnu'}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        <span className="tabular">{formatTime(appointment.appointmentDate)}</span> · {appointment.purpose || 'Consultation générale'}
                      </p>
                      <StatusBadge status={appointment.doctorStatus} />
                    </div>
                    {actions(appointment)}
                  </li>
                );
              })}
            </ul>

            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-3 border-t px-4 py-3">
                <p className="tabular text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {startIndex + 1}–{Math.min(startIndex + appointmentsPerPage, sortedAppointments.length)}
                  </span>{' '}
                  sur {sortedAppointments.length}
                </p>
                <div className="flex items-center gap-2">
                  <span className="tabular hidden text-xs text-muted-foreground sm:inline">Page {currentPage} / {totalPages}</span>
                  <Button variant="outline" size="icon-sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} aria-label="Page précédente">
                    <ChevronLeft />
                  </Button>
                  <Button variant="outline" size="icon-sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} aria-label="Page suivante">
                    <ChevronRight />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <AddAppointmentDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />

      <AlertDialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce rendez-vous ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le rendez-vous sera définitivement retiré de l'agenda. Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toDelete) deleteAppointment(toDelete);
                setToDelete(null);
              }}
              className={buttonVariants({ variant: 'destructive' })}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RowActions({
  status,
  upcoming,
  patientHref,
  onConfirm,
  onCancel,
  onComplete,
  onDelete,
}: {
  status: string;
  upcoming: boolean;
  patientHref?: string;
  onConfirm: () => void;
  onCancel: () => void;
  onComplete: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="text-muted-foreground" aria-label="Actions">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Actions</DropdownMenuLabel>
        {patientHref && (
          <DropdownMenuItem asChild>
            <Link href={patientHref}>
              <User /> Voir le patient
            </Link>
          </DropdownMenuItem>
        )}
        {status !== 'confirmed' && status !== 'completed' && upcoming && (
          <DropdownMenuItem onClick={onConfirm}>
            <Check /> Confirmer
          </DropdownMenuItem>
        )}
        {status !== 'completed' && status !== 'cancelled' && !upcoming && (
          <DropdownMenuItem onClick={onComplete}>
            <CalendarCheck /> Marquer comme terminé
          </DropdownMenuItem>
        )}
        {status !== 'cancelled' && status !== 'completed' && (
          <DropdownMenuItem onClick={onCancel}>
            <X /> Annuler le rendez-vous
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
          <Trash2 /> Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
