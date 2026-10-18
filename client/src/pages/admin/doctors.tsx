import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Mail, MoreHorizontal, Pencil, Plus, Stethoscope, Trash2, TriangleAlert, KeyRound } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState, PageHeader, SearchInput, UserAvatar } from '@/components/kit';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { formatShortDate } from '@/lib/utils';
import DoctorDialog from '@/components/admin/doctor-dialog';
import { CredentialsDialog, readInvitation, type DoctorCredentials } from '@/components/admin/credentials-dialog';

function TableSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="border-b p-4">
        <Skeleton className="h-9 w-full max-w-sm" />
      </div>
      <div className="divide-y">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="hidden h-5 w-24 sm:block" />
            <Skeleton className="hidden h-4 w-32 md:block" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function AdminDoctorsPage() {
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [credentials, setCredentials] = useState<DoctorCredentials | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: doctors, isLoading } = useQuery({
    queryKey: ['admin-doctors'],
    queryFn: () => apiRequest('GET', '/api/admin/doctors').then(res => res.json())
  });

  const deleteMutation = useMutation({
    mutationFn: (doctorId: string) => apiRequest('DELETE', `/api/admin/doctors/${doctorId}`),
    onSuccess: () => {
      // Invalider les requêtes pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setIsDeleteDialogOpen(false);
      setSelectedDoctor(null);
      toast({
        title: 'Médecin supprimé avec succès'
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la suppression',
        variant: 'destructive'
      });
    }
  });

  // Génère un nouveau mot de passe temporaire et l'envoie par e-mail
  const sendCredentialsMutation = useMutation({
    mutationFn: async (doctorId: string) => {
      const res = await apiRequest('POST', `/api/admin/doctors/${doctorId}/send-credentials`, {});
      return res.json();
    },
    onSuccess: (doctor: any) => {
      if (doctor?.invitation?.emailSent) {
        toast({ title: 'Identifiants envoyés', description: `Un nouveau mot de passe a été envoyé à ${doctor.user.email}.` });
      } else {
        setCredentials(readInvitation(doctor));
      }
    },
    onError: (error) => {
      toast({
        title: 'Envoi impossible',
        description: error instanceof Error ? error.message : 'Veuillez réessayer',
        variant: 'destructive',
      });
    },
  });

  const openCreate = () => {
    setSelectedDoctor(null);
    setIsAddEditDialogOpen(true);
  };
  const openEdit = (doctor: any) => {
    setSelectedDoctor(doctor);
    setIsAddEditDialogOpen(true);
  };
  const openDelete = (doctor: any) => {
    setSelectedDoctor(doctor);
    setIsDeleteDialogOpen(true);
  };

  const list: any[] = doctors ?? [];
  const q = search.trim().toLowerCase();
  const filtered = q
    ? list.filter((d) =>
        [d.user?.firstName, d.user?.lastName, d.user?.email, d.specialty, d.hospital]
          .filter(Boolean)
          .some((v: string) => v.toLowerCase().includes(q)),
      )
    : list;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Médecins"
        description="Gérez les comptes des praticiens de la plateforme."
        actions={
          <Button onClick={openCreate}>
            <Plus /> Ajouter un médecin
          </Button>
        }
      />

      {isLoading ? (
        <TableSkeleton />
      ) : (
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
            <SearchInput
              placeholder="Rechercher un nom, une spécialité, un hôpital…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:max-w-sm"
            />
            <p className="tabular text-xs text-muted-foreground">
              {filtered.length} médecin{filtered.length > 1 ? 's' : ''}
              {q && ` sur ${list.length}`}
            </p>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Stethoscope />}
              title={q ? 'Aucun résultat' : 'Aucun médecin'}
              description={q ? 'Essayez un autre terme de recherche.' : 'Ajoutez un premier praticien pour commencer.'}
              action={
                q ? (
                  <Button variant="outline" onClick={() => setSearch('')}>Effacer la recherche</Button>
                ) : (
                  <Button onClick={openCreate}><Plus /> Ajouter un médecin</Button>
                )
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Médecin</TableHead>
                    <TableHead className="hidden sm:table-cell">Spécialité</TableHead>
                    <TableHead className="hidden md:table-cell">Hôpital</TableHead>
                    <TableHead className="hidden lg:table-cell">Inscrit le</TableHead>
                    <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((doctor: any) => (
                    <TableRow key={doctor._id} className="cursor-pointer hover:bg-muted/50" onClick={() => openEdit(doctor)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <UserAvatar firstName={doctor.user?.firstName} lastName={doctor.user?.lastName} />
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              Dr. {doctor.user?.firstName} {doctor.user?.lastName}
                            </p>
                            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                              <Mail className="h-3 w-3 shrink-0" />
                              {doctor.user?.email}
                            </p>
                            {doctor.specialty && (
                              <Badge variant="soft" className="mt-1.5 sm:hidden">{doctor.specialty}</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {doctor.specialty ? (
                          <Badge variant="soft">{doctor.specialty}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Non renseignée</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {doctor.hospital ? (
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Building2 className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate text-foreground">{doctor.hospital}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="tabular hidden text-muted-foreground lg:table-cell">
                        {doctor.createdAt ? formatShortDate(doctor.createdAt) : '—'}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" aria-label="Actions">
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={() => openEdit(doctor)}>
                              <Pencil /> Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={sendCredentialsMutation.isPending}
                              onClick={() => sendCredentialsMutation.mutate(doctor._id)}
                            >
                              <KeyRound /> Renvoyer les identifiants
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                              onClick={() => openDelete(doctor)}
                            >
                              <Trash2 /> Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
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
              <DialogTitle>Supprimer ce médecin ?</DialogTitle>
              <DialogDescription>
                {selectedDoctor?.user
                  ? `Le compte de Dr. ${selectedDoctor.user.firstName} ${selectedDoctor.user.lastName} sera définitivement supprimé. `
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
              disabled={deleteMutation.isPending}
              onClick={() => selectedDoctor && deleteMutation.mutate(selectedDoctor._id)}
            >
              <Trash2 /> Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CredentialsDialog credentials={credentials} onClose={() => setCredentials(null)} />

      <DoctorDialog
        isOpen={isAddEditDialogOpen}
        onClose={() => {
          setIsAddEditDialogOpen(false);
          setSelectedDoctor(null);
        }}
        doctor={selectedDoctor}
      />
    </div>
  );
}
