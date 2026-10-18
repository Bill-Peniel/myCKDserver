import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, FlaskConical, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader } from '@/components/ui/loader';
import { PageHeader, UserAvatar } from '@/components/kit';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { RangePreview } from './index';

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

function FormSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-4 py-6 first:pt-0 last:pb-0 md:grid-cols-3 md:gap-6">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-4 md:col-span-2">{children}</div>
    </div>
  );
}

export default function LabResultAdd() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: patients, isLoading: patientsLoading } = useQuery<any[]>({
    queryKey: ['/api/patients'],
  });

  const { data: labTests, isLoading: labTestsLoading } = useQuery<any[]>({
    queryKey: ['/api/lab-tests'],
    enabled: true
  });

  const { user } = useAuth();

  const form = useForm<LabResultFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: '',
      labTestId: '',
      resultValue: '',
      resultDate: new Date().toISOString().split('T')[0],
    },
  });

  // Plus de filtrage des tests par sexe
  const filteredTests = labTests;

  // Test sélectionné (unité et plage normale)
  const [selectedTest, setSelectedTest] = useState<any | null>(null);

  const watchLabTestId = form.watch('labTestId');
  const watchPatientId = form.watch('patientId');
  const watchValue = form.watch('resultValue');

  if (watchLabTestId && labTests && (!selectedTest || selectedTest._id.toString() !== watchLabTestId)) {
    const test = labTests.find(t => t._id.toString() === watchLabTestId);
    if (test) {
      setSelectedTest(test);
    }
  }

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
      setLocation('/lab-results');
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : "Échec de l'ajout du résultat",
        variant: 'destructive',
      });
    }
  });

  const onSubmit = (data: LabResultFormValues) => {
    createLabResultMutation.mutate(data);
  };

  const isLoading = patientsLoading || labTestsLoading;

  const groups = new Map<string, any[]>();
  for (const t of filteredTests ?? []) {
    const key = t.category || 'Autres';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }

  const selectedPatient = patients?.find((p) => p._id === watchPatientId);

  return (
    <div className="space-y-6">
      <PageHeader
        leading={
          <Button variant="outline" size="icon" onClick={() => setLocation('/lab-results')} aria-label="Retour aux résultats">
            <ArrowLeft />
          </Button>
        }
        eyebrow="Résultats de laboratoire"
        title="Nouveau résultat"
        description="Enregistrez un résultat d'analyse biologique pour un patient."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Saisie du résultat</CardTitle>
            <CardDescription>Les champs sont obligatoires. Une alerte est générée si la valeur sort de la plage normale.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <div className="divide-y">
                    <FormSection title="Patient et analyse" description="Choisissez le patient concerné et le type de test réalisé.">
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
                                    <span className="ml-1.5 text-muted-foreground">
                                      ({patient.gender === 'M' ? 'H' : patient.gender === 'F' ? 'F' : patient.gender})
                                    </span>
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
                                {Array.from(groups.entries()).map(([category, tests]) => (
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
                    </FormSection>

                    <FormSection title="Mesure" description="Valeur relevée et date de réalisation du prélèvement.">
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
                    </FormSection>
                  </div>

                  <div className="mt-6 flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={() => setLocation('/lab-results')}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={createLabResultMutation.isPending}>
                      {createLabResultMutation.isPending && <Loader color="white" size="sm" />}
                      Enregistrer le résultat
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Aperçu</CardTitle>
              <CardDescription>Position de la valeur dans la plage normale.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedPatient && (
                <div className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
                  <UserAvatar firstName={selectedPatient.user?.firstName} lastName={selectedPatient.user?.lastName} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium">
                      {selectedPatient.user?.firstName} {selectedPatient.user?.lastName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {selectedPatient.age ? `${selectedPatient.age} ans` : 'Patient'}
                      {selectedPatient.ckdStage ? ` · ${selectedPatient.ckdStage.replace('Stage', 'Stade')}` : ''}
                    </p>
                  </div>
                </div>
              )}
              {selectedTest ? (
                <RangePreview
                  test={selectedTest}
                  value={toNum(watchValue)}
                  min={toNum(selectedTest.normalMin)}
                  max={toNum(selectedTest.normalMax)}
                />
              ) : (
                <div className="flex flex-col items-center rounded-lg border border-dashed px-4 py-8 text-center">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
                    <FlaskConical className="h-4 w-4" />
                  </div>
                  <p className="text-[13px] font-medium">Aucun test sélectionné</p>
                  <p className="mt-1 text-xs text-muted-foreground">Choisissez un type de test pour afficher sa plage normale.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3 rounded-xl border bg-info/5 p-4 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />
            <p>
              Les valeurs hors plage déclenchent automatiquement une notification et sont mises en évidence dans le dossier du patient.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
