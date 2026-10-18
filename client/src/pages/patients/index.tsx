import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import AddEditDialog from '@/components/patients/add-edit-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  MapPin,
  MoreHorizontal,
  Pencil,
  Phone,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { EmptyState, PageHeader, SearchInput, StageBadge, UserAvatar } from '@/components/kit';
import { Patient } from '@/lib/types';
import { calculateAge, cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';

const STAGES = ['Stage 1', 'Stage 2', 'Stage 3A', 'Stage 3B', 'Stage 4', 'Stage 5'];

const GENDER_LABELS: Record<string, string> = { M: 'Homme', F: 'Femme', Autre: 'Autre' };

const patientCode = (p: any) => `P-${String(p._id ?? p.id).padStart(5, '0')}`;

function TableSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="hidden h-5 w-20 rounded-md sm:block" />
          <Skeleton className="hidden h-3.5 w-28 md:block" />
          <Skeleton className="h-7 w-7 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export default function PatientsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [addEditDialogOpen, setAddEditDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | undefined>();
  const [patientToDelete, setPatientToDelete] = useState<Patient | undefined>();
  const patientsPerPage = 10;

  const { data: patients, isLoading, refetch } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
  });

  const filteredPatients = patients?.filter(patient => {
    const matchesSearch = searchQuery ? (
      patient.user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.user.email.toLowerCase().includes(searchQuery.toLowerCase())
    ) : true;

    const matchesStage = filterStage === 'all' ? true : patient.ckdStage === filterStage;

    return matchesSearch && matchesStage;
  }) || [];

  // Pagination
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);
  const startIndex = (currentPage - 1) * patientsPerPage;
  const paginatedPatients = filteredPatients.slice(startIndex, startIndex + patientsPerPage);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Retour à la première page lors d'une recherche
    setCurrentPage(1);
  };

  const handleDeletePatient = async (patient: Patient) => {
    try {
      await apiRequest('DELETE', `/api/patients/${(patient as any)._id}`, {});
      toast({
        title: 'Patient supprimé',
        description: 'Le dossier du patient a bien été supprimé.',
      });
      refetch();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le patient.',
        variant: 'destructive',
      });
    }
  };

  const openEdit = (patient: Patient) => {
    setSelectedPatient(patient);
    setAddEditDialogOpen(true);
  };

  const hasFilters = searchQuery !== '' || filterStage !== 'all';

  const RowActions = ({ patient }: { patient: Patient }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-foreground"
          aria-label="Actions"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem asChild>
          <Link href={`/patients/${(patient as any)._id}`}>
            <Eye /> Voir la fiche
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => openEdit(patient)}>
          <Pencil /> Modifier
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
          onSelect={() => setPatientToDelete(patient)}
        >
          <Trash2 /> Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patients"
        description="Gérez et consultez l'ensemble des patients que vous suivez."
        actions={
          <Button onClick={() => setAddEditDialogOpen(true)}>
            <UserPlus /> Ajouter un patient
          </Button>
        }
      />

      <Card className="overflow-hidden">
        {/* Barre d'outils */}
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center">
          <form onSubmit={handleSearch} className="w-full sm:max-w-xs">
            <SearchInput
              placeholder="Rechercher un patient…"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </form>
          <Select
            value={filterStage}
            onValueChange={(v) => {
              setFilterStage(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrer par stade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les stades</SelectItem>
              {STAGES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace('Stage', 'Stade')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="self-start text-muted-foreground sm:self-auto"
              onClick={() => {
                setSearchQuery('');
                setFilterStage('all');
                setCurrentPage(1);
              }}
            >
              Réinitialiser
            </Button>
          )}
          <p className="text-xs text-muted-foreground sm:ml-auto">
            <span className="tabular font-medium text-foreground">{filteredPatients.length}</span>{' '}
            patient{filteredPatients.length > 1 ? 's' : ''}
            {patients && hasFilters ? ` sur ${patients.length}` : ''}
          </p>
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : filteredPatients.length === 0 ? (
          <EmptyState
            icon={<Users />}
            title={hasFilters ? 'Aucun patient trouvé' : 'Aucun patient pour le moment'}
            description={
              hasFilters
                ? 'Essayez de modifier votre recherche ou le filtre de stade.'
                : 'Ajoutez votre premier patient pour commencer le suivi.'
            }
            action={
              hasFilters ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterStage('all');
                  }}
                >
                  Effacer les filtres
                </Button>
              ) : (
                <Button onClick={() => setAddEditDialogOpen(true)}>
                  <UserPlus /> Ajouter un patient
                </Button>
              )
            }
          />
        ) : (
          <>
            {/* Vue tableau (≥ md) */}
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-5">Patient</TableHead>
                    <TableHead>Dossier</TableHead>
                    <TableHead>Âge / Sexe</TableHead>
                    <TableHead>Stade MRC</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="w-12 pr-5 text-right">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPatients.map((patient) => (
                    <TableRow
                      key={(patient as any)._id}
                      className="cursor-pointer transition-colors hover:bg-muted/50"
                      onClick={() => setLocation(`/patients/${(patient as any)._id}`)}
                    >
                      <TableCell className="pl-5">
                        <div className="flex items-center gap-3">
                          <UserAvatar firstName={patient.user.firstName} lastName={patient.user.lastName} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">
                              {patient.user.firstName} {patient.user.lastName}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">{patient.user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="tabular rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                          {patientCode(patient)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <p className="tabular text-foreground">{calculateAge(patient.birthDate)} ans</p>
                        <p className="text-xs text-muted-foreground">{GENDER_LABELS[patient.gender] ?? patient.gender}</p>
                      </TableCell>
                      <TableCell>
                        <StageBadge stage={patient.ckdStage} />
                      </TableCell>
                      <TableCell>
                        <p className="tabular whitespace-nowrap text-foreground">{patient.phone || '—'}</p>
                        <p className="max-w-[200px] truncate text-xs text-muted-foreground">
                          {patient.address || 'Adresse non renseignée'}
                        </p>
                      </TableCell>
                      <TableCell className="pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <RowActions patient={patient} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Vue cartes (mobile) */}
            <ul className="divide-y md:hidden">
              {paginatedPatients.map((patient) => (
                <li
                  key={(patient as any)._id}
                  className="flex cursor-pointer items-start gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50"
                  onClick={() => setLocation(`/patients/${(patient as any)._id}`)}
                >
                  <UserAvatar firstName={patient.user.firstName} lastName={patient.user.lastName} />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {patient.user.firstName} {patient.user.lastName}
                      </p>
                      <StageBadge stage={patient.ckdStage} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="tabular">{calculateAge(patient.birthDate)} ans</span> ·{' '}
                      {GENDER_LABELS[patient.gender] ?? patient.gender} · {patientCode(patient)}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {patient.phone && (
                        <span className="tabular inline-flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {patient.phone}
                        </span>
                      )}
                      {patient.address && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {patient.address}
                        </span>
                      )}
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()} className="-mr-1">
                    <RowActions patient={patient} />
                  </div>
                </li>
              ))}
            </ul>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col items-center justify-between gap-3 border-t px-5 py-3 sm:flex-row">
                <p className="text-xs text-muted-foreground">
                  <span className="tabular">
                    {startIndex + 1}–{Math.min(startIndex + patientsPerPage, filteredPatients.length)}
                  </span>{' '}
                  sur <span className="tabular">{filteredPatients.length}</span> patients
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Page précédente"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeft />
                  </Button>
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'secondary' : 'ghost'}
                        size="icon-sm"
                        className={cn('tabular', currentPage === page && 'font-semibold')}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Page suivante"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <AddEditDialog
        isOpen={addEditDialogOpen}
        onClose={() => {
          setAddEditDialogOpen(false);
          setSelectedPatient(undefined);
        }}
        patient={selectedPatient}
      />

      <AlertDialog open={!!patientToDelete} onOpenChange={(open) => !open && setPatientToDelete(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce patient ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le dossier de{' '}
              <span className="font-medium text-foreground">
                {patientToDelete?.user.firstName} {patientToDelete?.user.lastName}
              </span>{' '}
              sera définitivement supprimé. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (patientToDelete) handleDeletePatient(patientToDelete);
                setPatientToDelete(undefined);
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
