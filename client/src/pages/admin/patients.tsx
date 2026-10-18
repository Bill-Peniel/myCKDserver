import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Mail, MoreHorizontal, Pencil, Plus, Trash2, TriangleAlert, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState, PageHeader, SearchInput, StageBadge, UserAvatar } from '@/components/kit';
import { apiRequest } from '@/lib/queryClient';
import { calculateAge, getCKDStageLabel } from '@/lib/utils';

import AdminPatientDialog from '@/components/admin/patient-dialog';

const STAGES = ['Stage 1', 'Stage 2', 'Stage 3A', 'Stage 3B', 'Stage 4', 'Stage 5'];
const GENDER: Record<string, string> = { M: 'Homme', F: 'Femme', Autre: 'Autre' };

function TableSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="flex gap-3 border-b p-4">
        <Skeleton className="h-9 w-full max-w-sm" />
        <Skeleton className="h-9 w-40" />
      </div>
      <div className="divide-y">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="hidden h-4 w-32 md:block" />
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function AdminPatientsPage() {
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [addEditDialogOpen, setAddEditDialogOpen] = useState(false);

  const { data: patients, isLoading, refetch } = useQuery({
    queryKey: ['admin-patients'],
    queryFn: () => apiRequest('GET', '/api/admin/patients').then(res => res.json())
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = async (patientId: string) => {
    try {
      await apiRequest('DELETE', `/api/admin/patients/${patientId}`);
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setIsDeleteDialogOpen(false);
      toast({ title: 'Patient supprimé', description: 'Le dossier et ses données ont été supprimés.' });
    } catch (error) {
      toast({
        title: 'Suppression impossible',
        description: error instanceof Error ? error.message : 'Veuillez réessayer',
        variant: 'destructive',
      });
    }
  };

  const filteredPatients = patients?.filter((patient: any) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      patient.user.firstName.toLowerCase().includes(searchLower) ||
      patient.user.lastName.toLowerCase().includes(searchLower) ||
      patient.user.email.toLowerCase().includes(searchLower)
    );
  });

  const visible: any[] = (filteredPatients ?? []).filter(
    (p: any) => stageFilter === 'all' || p.ckdStage === stageFilter,
  );
  const total = patients?.length ?? 0;
  const isFiltering = searchQuery.trim() !== '' || stageFilter !== 'all';

  const openCreate = () => {
    setSelectedPatient(undefined);
    setAddEditDialogOpen(true);
  };
  const openEdit = (patient: any) => {
    setAddEditDialogOpen(true);
    setSelectedPatient(patient);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Patients"
        description="Tous les dossiers patients, leur stade et leur médecin référent."
        actions={
          <Button onClick={openCreate}>
            <Plus /> Ajouter un patient
          </Button>
        }
      />

      {isLoading ? (
        <TableSkeleton />
      ) : (
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center">
            <SearchInput
              placeholder="Rechercher par nom ou e-mail…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sm:max-w-sm"
            />
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="sm:w-44">
                <SelectValue placeholder="Stade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les stades</SelectItem>
                {STAGES.map((s) => (
                  <SelectItem key={s} value={s}>{getCKDStageLabel(s)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="tabular text-xs text-muted-foreground sm:ml-auto">
              {visible.length} patient{visible.length > 1 ? 's' : ''}
              {isFiltering && ` sur ${total}`}
            </p>
          </div>

          {visible.length === 0 ? (
            <EmptyState
              icon={<Users />}
              title={isFiltering ? 'Aucun patient trouvé' : 'Aucun patient'}
              description={isFiltering ? 'Modifiez la recherche ou le filtre de stade.' : 'Créez un premier dossier patient.'}
              action={
                isFiltering ? (
                  <Button variant="outline" onClick={() => { setSearchQuery(''); setStageFilter('all'); }}>
                    Réinitialiser les filtres
                  </Button>
                ) : (
                  <Button onClick={openCreate}><Plus /> Ajouter un patient</Button>
                )
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead className="hidden sm:table-cell">Âge</TableHead>
                    <TableHead className="hidden md:table-cell">Médecin référent</TableHead>
                    <TableHead className="hidden sm:table-cell">Stade</TableHead>
                    <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((patient: any) => {
                    const age = patient.age ?? (patient.birthDate ? calculateAge(patient.birthDate) : null);
                    return (
                      <TableRow key={patient._id} className="cursor-pointer hover:bg-muted/50" onClick={() => openEdit(patient)}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <UserAvatar firstName={patient.user.firstName} lastName={patient.user.lastName} />
                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {patient.user.firstName} {patient.user.lastName}
                              </p>
                              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                                <Mail className="h-3 w-3 shrink-0" />
                                {patient.user.email}
                              </p>
                              <StageBadge stage={patient.ckdStage} className="mt-1.5 sm:hidden" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="tabular">{age != null ? `${age} ans` : '—'}</span>
                          {patient.gender && (
                            <span className="block text-xs text-muted-foreground">{GENDER[patient.gender] ?? patient.gender}</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {patient.doctor?.user ? (
                            <div className="flex items-center gap-2">
                              <UserAvatar firstName={patient.doctor.user.firstName} lastName={patient.doctor.user.lastName} size="xs" />
                              <div className="min-w-0">
                                <p className="truncate text-[13px]">
                                  Dr. {patient.doctor.user.firstName} {patient.doctor.user.lastName}
                                </p>
                                {patient.doctor.specialty && (
                                  <p className="truncate text-xs text-muted-foreground">{patient.doctor.specialty}</p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center rounded-md border border-dashed px-2 py-0.5 text-xs text-muted-foreground">
                              Non assigné
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <StageBadge stage={patient.ckdStage} />
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm" aria-label="Actions">
                                <MoreHorizontal />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem onClick={() => openEdit(patient)}>
                                <Pencil /> Modifier
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                onClick={() => {
                                  setSelectedPatient(patient);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 /> Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex-row items-start gap-4 space-y-0 text-left">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/20">
              <TriangleAlert className="h-5 w-5" />
            </span>
            <div className="space-y-1.5">
              <DialogTitle>Supprimer ce patient ?</DialogTitle>
              <DialogDescription>
                {selectedPatient?.user
                  ? `Le dossier de ${selectedPatient.user.firstName} ${selectedPatient.user.lastName} et ses données associées seront définitivement supprimés. `
                  : ''}
                Cette action est irréversible.
              </DialogDescription>
            </div>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:space-x-0">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedPatient && handleDelete(selectedPatient._id)}
            >
              <Trash2 /> Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AdminPatientDialog
        isOpen={addEditDialogOpen}
        onClose={() => {
          setAddEditDialogOpen(false);
          setSelectedPatient(undefined);
        }}
        patient={selectedPatient}
      />
    </div>
  );
}
