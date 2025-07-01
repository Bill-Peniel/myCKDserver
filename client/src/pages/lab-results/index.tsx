import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Plus, Search, Filter, FileText } from 'lucide-react';
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
import { PatientLabResult, Patient, LabTest, Doctor, LabResultFormData } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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

export default function LabResultsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
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
        title: 'Succès',
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

  const form = useForm<LabResultFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: '',
      labTestId: '',
      resultValue: '',
      resultDate: new Date().toISOString().split('T')[0],
    },
  });

  const { data: labResults = [], isLoading: resultsLoading } = useQuery<PatientLabResult[]>({
    queryKey: ['/api/patient-lab-results'],
  });

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
  });

  const { data: labTests = [], isLoading: labTestsLoading } = useQuery<LabTest[]>({
    queryKey: ['/api/lab-tests'],
  });

  const { data: doctors = [] } = useQuery<Doctor[]>({
    queryKey: ['/api/doctors'],
  });

  const createLabResultMutation = useMutation({
    mutationFn: async (data: LabResultFormData) => {
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
        title: 'Succès',
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

  const getPatientName = (patientId: string) => {
    const patient = patients?.find(p => p._id === patientId);
    return patient ? `${patient.user.firstName} ${patient.user.lastName}` : 'Patient inconnu';
  };

  const getTestName = (testId: string) => {
    const test = labTests?.find(t => t._id === testId);
    return test ? test.testName : `Test #${testId}`;
  };

  const getDoctorName = (doctorId: string | undefined) => {
    const doctor = doctors?.find(d => d._id === doctorId);
    return doctor ? `Dr. ${doctor.user.firstName} ${doctor.user.lastName}` : 'Médecin inconnu';
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

    return matchesSearch && matchesPatient;
  }) || [];

  const sortedResults = [...filteredResults].sort(
    (a, b) => new Date(b.resultDate).getTime() - new Date(a.resultDate).getTime()
  );

  const totalPages = Math.ceil(sortedResults.length / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const paginatedResults = sortedResults.slice(startIndex, startIndex + resultsPerPage);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const onSubmit = (data: LabResultFormData) => {
    createLabResultMutation.mutate(data);
  };

  const watchLabTestId = form.watch('labTestId');

  if (watchLabTestId && labTests && (!selectedTest || selectedTest._id.toString() !== watchLabTestId)) {
    const test = labTests.find(t => t._id.toString() === watchLabTestId);
    if (test) {
      setSelectedTest(test);
    }
  }


  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Résultats de laboratoire</h1>
        <Button className="flex items-center gap-2" onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          <span>Ajouter un résultat</span>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Registre des résultats</CardTitle>
              <CardDescription>
                Consultez et gérez tous les résultats d'analyses
              </CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <form onSubmit={handleSearch} className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Rechercher patients ou tests..."
                  className="pl-8 w-full sm:w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select
                  value={selectedPatient}
                  onValueChange={setSelectedPatient}
                >
                  <SelectTrigger className="w-[180px]">
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
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {resultsLoading ? (
            <div className="h-96 flex items-center justify-center">
              <Loader size="lg" />
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center text-gray-500">
              <FileText className="h-12 w-12 mb-4" />
              <h3 className="text-lg font-medium">Aucun résultat de laboratoire trouvé</h3>
              <p className="text-sm">Essayez d'ajuster vos critères de recherche ou de filtrage</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedResults.map((result) => {
                  const value = result.resultValue ? parseFloat(result.resultValue.toString()) : 0;
                  const min = result.labTest?.normalMin ? parseFloat(result.labTest.normalMin.toString()) : undefined;
                  const max = result.labTest?.normalMax ? parseFloat(result.labTest.normalMax.toString()) : undefined;

                  let status = 'Normal';
                  let statusColor = 'text-green-600 bg-green-50';
                  let icon = '✓';

                  if (min !== undefined && max !== undefined) {
                    const normalValue = (max + min) / 2;
                    const deviation = Math.abs((value - normalValue) / normalValue);

                    if (value < min) {
                      if (deviation > 0.3) {
                        status = 'Dangereusement bas';
                        statusColor = 'text-red-700 bg-red-100 font-bold';
                        icon = '⚠️↓';
                      } else {
                        status = 'En dessous de la normale';
                        statusColor = 'text-orange-600 bg-orange-50';
                        icon = '↓';
                      }
                    } else if (value > max) {
                      if (deviation > 0.3) {
                        status = 'Dangereusement élevé';
                        statusColor = 'text-red-700 bg-red-100 font-bold';
                        icon = '⚠️↑';
                      } else {
                        status = 'Au-dessus de la normale';
                        statusColor = 'text-red-600 bg-red-50';
                        icon = '↑';
                      }
                    }
                  }

                  return (
                    <Card key={result._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg font-semibold">
                              {result.labTest?.testName || 'Test inconnu'}
                            </CardTitle>
                            <CardDescription>
                              {result.labTest?.description || 'Description non disponible'}
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className={`${statusColor} text-xs flex items-center gap-1`}>
                            {icon} {status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          <div className="flex flex-col space-y-1">
                            <span className="text-sm font-medium text-muted-foreground">Patient</span>
                            <span className="font-medium">
                              {result.patient?.user ? `${result.patient.user.firstName} ${result.patient.user.lastName}` : 'Patient inconnu'}
                            </span>
                          </div>

                          <div className="flex flex-col space-y-1">
                            <span className="text-sm font-medium text-muted-foreground">Résultat</span>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold">{value}</span>
                              <span className="text-sm text-muted-foreground">{result.labTest?.unit || ''}</span>
                            </div>
                            {(min !== undefined && max !== undefined) && (
                              <span className="text-xs text-muted-foreground">
                                Plage normale: {min} - {max} {result.labTest?.unit || ''}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col space-y-1">
                              <span className="text-sm font-medium text-muted-foreground">Médecin</span>
                              <span className="text-sm">
                                {result.doctor?.user ? 
                                  `Dr. ${result.doctor.user.firstName} ${result.doctor.user.lastName}` : 
                                  'Médecin non spécifié'
                                }
                              </span>
                            </div>
                            <div className="flex flex-col space-y-1">
                              <span className="text-sm font-medium text-muted-foreground">Date</span>
                              <span className="text-sm">{formatDate(result.resultDate)}</span>
                            </div>
                          </div>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            className="mt-4"
                            onClick={() => handleDeleteClick(result._id)}
                          >
                            Supprimer
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-500">
                    Affichage de {startIndex + 1} à {Math.min(startIndex + resultsPerPage, filteredResults.length)} sur {filteredResults.length} résultats
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Ajouter un résultat</DialogTitle>
            <DialogDescription>
              Enregistrer un nouveau résultat d'analyse
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
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
                    <FormLabel>Type de test</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un test" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px]">
                        {labTests?.map((test) => (
                          <SelectItem 
                            key={test._id} 
                            value={test._id.toString()}
                            className="flex flex-col items-start py-3"
                          >
                            <div className="font-medium">{test.testName}</div>
                            {test.description && (
                              <div className="text-sm text-gray-500 mt-1">
                                {test.description}
                              </div>
                            )}
                            {test.unit && (
                              <div className="text-xs text-gray-400 mt-1">
                                Unité: {test.unit}
                              </div>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedTest && selectedTest.description && (
                      <FormDescription>
                        {selectedTest.description}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="resultValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valeur du résultat</FormLabel>
                    <FormControl>
                      <div className="flex">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Entrer la valeur"
                          {...field}
                          className="rounded-r-none"
                        />
                        <div className="flex items-center justify-center px-3 border border-l-0 rounded-r-md bg-gray-50 text-gray-500">
                          {selectedTest?.unit || ''}
                        </div>
                      </div>
                    </FormControl>
                    {selectedTest && (selectedTest.normalMin !== null || selectedTest.normalMax !== null) && (
                      <FormDescription>
                        Plage normale: {selectedTest.normalMin || 'N/A'} - {selectedTest.normalMax || 'N/A'} {selectedTest.unit || ''}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="resultDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date du test</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={createLabResultMutation.isPending}
                >
                  {createLabResultMutation.isPending && (
                    <Loader color="white" size="sm" className="mr-2" />
                  )}
                  Enregistrer
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce résultat ? Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}