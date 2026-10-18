import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  MoreHorizontal,
  Plus,
  Trash2,
  User,
  Users,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader } from '@/components/ui/loader';
import { EmptyState, PageHeader, RangeBadge, SearchInput, StatCard, UserAvatar } from '@/components/kit';
import { cn, formatShortDate } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
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

const formSchema = z.object({
  patientId: z.string().min(1, { message: 'Veuillez sélectionner un patient' }),
  labTestId: z.string().min(1, { message: 'Veuillez sélectionner un test' }),
  resultValue: z.string().min(1, { message: 'Veuillez entrer une valeur' }),
  resultDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Veuillez entrer une date valide (AAAA-MM-JJ)' }),
});

type LabResultFormValues = z.infer<typeof formSchema>;

const toNum = (v: unknown): number | undefined => {
  if (v === null || v === undefined || v === '') return undefined;
  const n = parseFloat(String(v));
  return Number.isNaN(n) ? undefined : n;
};

/** Petite jauge : position de la valeur par rapport à la plage normale (zone centrale) */
export function RangeGauge({ value, min, max, className }: { value?: number; min?: number; max?: number; className?: string }) {
  if (min === undefined || max === undefined || max <= min) return null;
  const span = max - min;
  const lo = min - span * 0.5;
  const hi = max + span * 0.5;
  const out = value !== undefined && (value < min || value > max);
  const pct = value === undefined ? null : Math.min(97, Math.max(3, ((value - lo) / (hi - lo)) * 100));
  return (
    <div className={cn('relative h-1.5 w-full rounded-full bg-muted', className)} aria-hidden>
      <div className="absolute inset-y-0 left-1/4 right-1/4 rounded-full bg-success/30" />
      {pct !== null && (
        <div
          className={cn(
            'absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-card shadow-sm transition-[left] duration-300',
            out ? 'bg-destructive' : 'bg-success',
          )}
          style={{ left: `${pct}%` }}
        />
      )}
    </div>
  );
}

function groupTestsByCategory(tests: any[]) {
  const groups = new Map<string, any[]>();
  for (const t of tests ?? []) {
    const key = t.category || 'Autres';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }
  return Array.from(groups.entries());
}

function TableSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="hidden h-4 w-28 md:block" />
          <Skeleton className="hidden h-1.5 w-24 md:block" />
          <Skeleton className="h-5 w-16 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export default function LabResultsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('all');
  const [selectedTestFilter, setSelectedTestFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<any | null>(null);
  const resultsPerPage = 10;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const deleteLabResultMutation = useMutation({
    mutationFn: async (resultId: string) => {
      return apiRequest('DELETE', `/api/patient-lab-results/${resultId}`);
    },
    onSuccess: () => {
      toast({
        title: 'Résultat supprimé',
        description: 'Le résultat a été supprimé avec succès',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/patient-lab-results'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Échec de la suppression',
        variant: 'destructive',
      });
    }
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);

  const handleDeleteClick = (resultId: string) => {
    setSelectedResultId(resultId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (selectedResultId) {
      deleteLabResultMutation.mutate(selectedResultId);
      setDeleteDialogOpen(false);
    }
  };

  const form = useForm<LabResultFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: '',
      labTestId: '',
      resultValue: '',
      resultDate: new Date().toISOString().split('T')[0],
    },
  });

  const { data: labResults = [], isLoading: resultsLoading } = useQuery<any[]>({
    queryKey: ['/api/patient-lab-results'],
  });

  const { data: patients = [] } = useQuery<any[]>({
    queryKey: ['/api/patients'],
  });

  const { data: labTests = [] } = useQuery<any[]>({
    queryKey: ['/api/lab-tests'],
  });

  const { data: doctors = [] } = useQuery<any[]>({
    queryKey: ['/api/doctors'],
  });

  const createLabResultMutation = useMutation({
    mutationFn: async (data: LabResultFormValues) => {
      return apiRequest('POST', '/api/patient-lab-results', {
        patientId: data.patientId,
        doctorId: user?.id,
        labTestId: data.labTestId,
        resultValue: parseFloat(data.resultValue),
        resultDate: data.resultDate
      });
    },
    onSuccess: () => {
      toast({
        title: 'Résultat enregistré',
        description: 'Le résultat a été ajouté avec succès',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/patient-lab-results'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Échec de l\'ajout du résultat',
        variant: 'destructive',
      });
    }
  });

  const getTestName = (test: any) => {
    if (test && typeof test === 'object') return test.testName ?? '';
    const found = labTests?.find((t) => t._id === test);
    return found ? found.testName : `Test #${test}`;
  };

  const getDoctorName = (result: any) => {
    if (result.doctor?.user) return `Dr. ${result.doctor.user.firstName} ${result.doctor.user.lastName}`;
    const doctor = doctors?.find((d) => d._id === result.doctorId || d._id === result.doctor);
    return doctor ? `Dr. ${doctor.user.firstName} ${doctor.user.lastName}` : 'Médecin non spécifié';
  };

  const filteredResults = labResults?.filter(result => {
    const testName = getTestName(result.labTest);
    const patientName = result.patient?.user
      ? `${result.patient.user.firstName} ${result.patient.user.lastName}`.toLowerCase()
      : '';
    const searchLower = searchQuery.toLowerCase();

    const matchesSearch = searchQuery ? (
      testName.toLowerCase().includes(searchLower) ||
      patientName.includes(searchLower)
    ) : true;

    const matchesPatient = selectedPatient === 'all' ? true : result.patient?._id === selectedPatient;
    const matchesTest = selectedTestFilter === 'all' ? true : String(result.labTest?._id ?? result.labTestId) === selectedTestFilter;

    return matchesSearch && matchesPatient && matchesTest;
  }) || [];

  const sortedResults = [...filteredResults].sort(
    (a, b) => new Date(b.resultDate).getTime() - new Date(a.resultDate).getTime()
  );

  const totalPages = Math.ceil(sortedResults.length / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const paginatedResults = sortedResults.slice(startIndex, startIndex + resultsPerPage);

  const stats = useMemo(() => {
    const outOfRange = labResults.filter((r) => {
      const v = toNum(r.resultValue);
      const min = toNum(r.labTest?.normalMin);
      const max = toNum(r.labTest?.normalMax);
      return v !== undefined && ((min !== undefined && v < min) || (max !== undefined && v > max));
    }).length;
    const patientIds = new Set(labResults.map((r) => r.patient?._id ?? r.patientId));
    const latest = labResults.reduce<string | null>(
      (acc, r) => (!acc || new Date(r.resultDate) > new Date(acc) ? r.resultDate : acc),
      null,
    );
    return { outOfRange, patients: patientIds.size, latest };
  }, [labResults]);

  const onSubmit = (data: LabResultFormValues) => {
    createLabResultMutation.mutate(data);
  };

  const watchLabTestId = form.watch('labTestId');
  const watchValue = form.watch('resultValue');

  if (watchLabTestId && labTests && (!selectedTest || selectedTest._id.toString() !== watchLabTestId)) {
    const test = labTests.find(t => t._id.toString() === watchLabTestId);
    if (test) {
      setSelectedTest(test);
    }
  }

  const testGroups = groupTestsByCategory(labTests);
  const hasFilters = searchQuery !== '' || selectedPatient !== 'all' || selectedTestFilter !== 'all';
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedPatient('all');
    setSelectedTestFilter('all');
    setCurrentPage(1);
  };

  const previewMin = toNum(selectedTest?.normalMin);
  const previewMax = toNum(selectedTest?.normalMax);
  const previewValue = toNum(watchValue);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Résultats de laboratoire"
        description="Consultez et gérez les analyses biologiques de vos patients."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/lab-results/add">Saisie détaillée</Link>
            </Button>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus /> Ajouter un résultat
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Analyses enregistrées" value={labResults.length} icon={<FlaskConical />} tone="violet" hint={`${labTests.length} types de tests`} />
        <StatCard
          label="Hors plage normale"
          value={stats.outOfRange}
          icon={<AlertTriangle />}
          tone={stats.outOfRange > 0 ? 'destructive' : 'success'}
          hint={labResults.length ? `${Math.round((stats.outOfRange / labResults.length) * 100)} % des résultats` : 'Aucun résultat'}
        />
        <StatCard label="Patients concernés" value={stats.patients} icon={<Users />} tone="primary" hint="Avec au moins une analyse" />
        <StatCard
          label="Dernière analyse"
          value={<span className="text-xl">{stats.latest ? formatShortDate(stats.latest) : '—'}</span>}
          icon={<CalendarClock />}
          tone="info"
          hint="Date du résultat le plus récent"
        />
      </div>

      <Card className="overflow-hidden">
        {/* Barre d'outils */}
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
          <SearchInput
            placeholder="Rechercher un patient ou un test…"
            className="lg:max-w-xs"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:flex">
            <Select
              value={selectedPatient}
              onValueChange={(v) => {
                setSelectedPatient(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="lg:w-[190px]">
                <SelectValue placeholder="Filtrer par patient" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les patients</SelectItem>
                {patients?.map(patient => (
                  <SelectItem key={patient._id} value={patient._id}>
                    {patient.user.firstName} {patient.user.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedTestFilter}
              onValueChange={(v) => {
                setSelectedTestFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="lg:w-[190px]">
                <SelectValue placeholder="Filtrer par test" />
              </SelectTrigger>
              <SelectContent className="max-h-[320px]">
                <SelectItem value="all">Tous les tests</SelectItem>
                {labTests?.map((test) => (
                  <SelectItem key={test._id} value={String(test._id)}>
                    {test.testName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-3 lg:ml-auto">
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground">
                Réinitialiser
              </Button>
            )}
            <span className="tabular text-xs text-muted-foreground">
              {sortedResults.length} résultat{sortedResults.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {resultsLoading ? (
          <TableSkeleton />
        ) : filteredResults.length === 0 ? (
          <EmptyState
            icon={<FlaskConical />}
            title="Aucun résultat de laboratoire trouvé"
            description={hasFilters ? "Essayez d'ajuster vos critères de recherche ou de filtrage." : 'Les analyses saisies apparaîtront ici.'}
            action={
              hasFilters ? (
                <Button variant="outline" onClick={resetFilters}>Réinitialiser les filtres</Button>
              ) : (
                <Button onClick={() => setIsDialogOpen(true)}><Plus /> Ajouter un résultat</Button>
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
                    <TableHead>Patient</TableHead>
                    <TableHead>Analyse</TableHead>
                    <TableHead className="text-right">Résultat</TableHead>
                    <TableHead className="w-[200px]">Plage normale</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedResults.map((result) => {
                    const value = toNum(result.resultValue) ?? 0;
                    const min = toNum(result.labTest?.normalMin);
                    const max = toNum(result.labTest?.normalMax);
                    const unit = result.labTest?.unit || '';
                    const out = (min !== undefined && value < min) || (max !== undefined && value > max);
                    const pu = result.patient?.user;
                    return (
                      <TableRow key={result._id} className="hover:bg-muted/50">
                        <TableCell>
                          {pu ? (
                            <Link href={`/patients/${result.patient._id}`} className="group flex items-center gap-3">
                              <UserAvatar firstName={pu.firstName} lastName={pu.lastName} size="sm" />
                              <div className="min-w-0">
                                <p className="truncate font-medium group-hover:underline group-hover:underline-offset-4">
                                  {pu.firstName} {pu.lastName}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {result.patient?.age ? `${result.patient.age} ans` : 'Patient'}
                                  {result.patient?.gender ? ` · ${result.patient.gender === 'M' ? 'Homme' : 'Femme'}` : ''}
                                </p>
                              </div>
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">Patient inconnu</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{result.labTest?.testName || 'Test inconnu'}</p>
                          <p className="max-w-[220px] truncate text-xs text-muted-foreground">
                            {result.labTest?.category || result.labTest?.description || '—'}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn('tabular text-[15px] font-semibold', out && 'text-destructive')}>{value}</span>
                          <span className="ml-1 text-xs text-muted-foreground">{unit}</span>
                        </TableCell>
                        <TableCell>
                          {min !== undefined && max !== undefined ? (
                            <div className="space-y-1.5">
                              <RangeGauge value={value} min={min} max={max} className="w-36" />
                              <p className="tabular text-xs text-muted-foreground">
                                {min} – {max} {unit}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Non définie</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <RangeBadge value={value} min={min} max={max} />
                        </TableCell>
                        <TableCell>
                          <p className="tabular whitespace-nowrap">{formatShortDate(result.resultDate)}</p>
                          <p className="whitespace-nowrap text-xs text-muted-foreground">{getDoctorName(result)}</p>
                        </TableCell>
                        <TableCell>
                          <RowActions
                            patientHref={result.patient?._id ? `/patients/${result.patient._id}` : undefined}
                            onDelete={() => handleDeleteClick(result._id)}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Vue cartes (mobile) */}
            <ul className="divide-y md:hidden">
              {paginatedResults.map((result) => {
                const value = toNum(result.resultValue) ?? 0;
                const min = toNum(result.labTest?.normalMin);
                const max = toNum(result.labTest?.normalMax);
                const unit = result.labTest?.unit || '';
                const out = (min !== undefined && value < min) || (max !== undefined && value > max);
                const pu = result.patient?.user;
                return (
                  <li key={result._id} className="space-y-3 p-4">
                    <div className="flex items-start gap-3">
                      <UserAvatar firstName={pu?.firstName} lastName={pu?.lastName} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{result.labTest?.testName || 'Test inconnu'}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {pu ? `${pu.firstName} ${pu.lastName}` : 'Patient inconnu'} · {formatShortDate(result.resultDate)}
                        </p>
                      </div>
                      <RowActions
                        patientHref={result.patient?._id ? `/patients/${result.patient._id}` : undefined}
                        onDelete={() => handleDeleteClick(result._id)}
                      />
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2.5">
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <RangeGauge value={value} min={min} max={max} />
                        <p className="tabular text-[11px] text-muted-foreground">
                          {min !== undefined && max !== undefined ? `Normale : ${min} – ${max} ${unit}` : 'Plage non définie'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={cn('tabular text-sm font-semibold', out && 'text-destructive')}>
                          {value} <span className="text-xs font-normal text-muted-foreground">{unit}</span>
                        </span>
                        <RangeBadge value={value} min={min} max={max} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {totalPages > 1 && (
              <Pager
                page={currentPage}
                totalPages={totalPages}
                from={startIndex + 1}
                to={Math.min(startIndex + resultsPerPage, sortedResults.length)}
                total={sortedResults.length}
                onChange={setCurrentPage}
              />
            )}
          </>
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter un résultat</DialogTitle>
            <DialogDescription>
              Enregistrez un nouveau résultat d'analyse pour l'un de vos patients.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px]">Patient</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un patient" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {patients?.map((patient) => (
                          <SelectItem key={patient._id} value={patient._id}>
                            {patient.user.firstName} {patient.user.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="labTestId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px]">Type de test</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un test" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[320px]">
                        {testGroups.map(([category, tests]) => (
                          <SelectGroup key={category}>
                            <SelectLabel className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                              {category}
                            </SelectLabel>
                            {tests.map((test) => (
                              <SelectItem key={test._id} value={test._id.toString()}>
                                {test.testName}
                                {test.unit ? <span className="ml-1.5 text-muted-foreground">({test.unit})</span> : null}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="resultValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px]">Valeur du résultat</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            {...field}
                            className={cn('tabular [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none', selectedTest?.unit && 'pr-16')}
                          />
                          {selectedTest?.unit && (
                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-muted-foreground">
                              {selectedTest.unit}
                            </span>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="resultDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px]">Date du test</FormLabel>
                      <FormControl>
                        <Input type="date" className="dark:[color-scheme:dark]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {selectedTest && (
                <RangePreview test={selectedTest} value={previewValue} min={previewMin} max={previewMax} />
              )}

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={createLabResultMutation.isPending}>
                  {createLabResultMutation.isPending && <Loader color="white" size="sm" />}
                  Enregistrer
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce résultat ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le résultat sera définitivement retiré du dossier du patient. Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: 'destructive' })}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Aperçu de la plage normale du test choisi (avec position de la valeur saisie) */
export function RangePreview({ test, value, min, max }: { test: any; value?: number; min?: number; max?: number }) {
  const hasRange = min !== undefined && max !== undefined;
  return (
    <div className="rounded-lg border bg-muted/40 p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
            <Activity className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium">{test.testName}</p>
            <p className="truncate text-xs text-muted-foreground">{test.description || test.category || 'Analyse biologique'}</p>
          </div>
        </div>
        {value !== undefined && hasRange && <RangeBadge value={value} min={min} max={max} />}
      </div>
      {hasRange ? (
        <div className="mt-3.5 space-y-2">
          <RangeGauge value={value} min={min} max={max} />
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Bas</span>
            <span className="tabular font-medium text-foreground">
              Normale : {min} – {max} {test.unit || ''}
            </span>
            <span>Élevé</span>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">Aucune plage normale définie pour ce test.</p>
      )}
    </div>
  );
}

function RowActions({ patientHref, onDelete }: { patientHref?: string; onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="text-muted-foreground" aria-label="Actions">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Actions</DropdownMenuLabel>
        {patientHref && (
          <DropdownMenuItem asChild>
            <Link href={patientHref}>
              <User /> Voir le patient
            </Link>
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

export function Pager({
  page,
  totalPages,
  from,
  to,
  total,
  onChange,
}: {
  page: number;
  totalPages: number;
  from: number;
  to: number;
  total: number;
  onChange: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t px-4 py-3">
      <p className="tabular text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{from}–{to}</span> sur {total}
      </p>
      <div className="flex items-center gap-2">
        <span className="tabular hidden text-xs text-muted-foreground sm:inline">
          Page {page} / {totalPages}
        </span>
        <Button variant="outline" size="icon-sm" onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1} aria-label="Page précédente">
          <ChevronLeft />
        </Button>
        <Button variant="outline" size="icon-sm" onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} aria-label="Page suivante">
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
