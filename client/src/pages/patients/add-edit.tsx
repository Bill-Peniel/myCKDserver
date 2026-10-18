import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, HeartPulse, Loader2, MapPin, Save, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader, StageBadge } from '@/components/kit';
import { cn } from '@/lib/utils';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PatientFormData, Patient } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';

interface PatientAddEditProps {
  id?: string;
}

const formSchema = z.object({
  firstName: z.string().min(2, { message: 'Le prénom doit contenir au moins 2 caractères' }),
  lastName: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères' }),
  email: z.string().email({ message: 'Veuillez saisir une adresse email valide' }),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Veuillez saisir une date valide (AAAA-MM-JJ)' }),
  gender: z.enum(['M', 'F', 'Autre'], { required_error: 'Veuillez sélectionner un sexe' }),
  address: z.string().optional(),
  phone: z.string().optional(),
  ckdStage: z.enum(['Stage 1', 'Stage 2', 'Stage 3A', 'Stage 3B', 'Stage 4', 'Stage 5'], { required_error: 'Veuillez sélectionner un stade MRC' }),
});

export default function PatientAddEdit({ id }: PatientAddEditProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!id;
  const patientId = isEditing ? parseInt(id) : undefined;

  // Define form
  const form = useForm<PatientFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: isEditing ? {} : {
      firstName: '',
      lastName: '',
      email: '',
      birthDate: new Date().toISOString().split('T')[0],
      gender: 'M',
      address: '',
      phone: '',
      ckdStage: 'Stage 3A',
    },
  });

  // Fetch patient data if editing
  const { data: patient, isLoading: patientLoading } = useQuery<Patient>({
    queryKey: [`/api/patients/${id}`],
    enabled: isEditing,
  });


  // Update form when patient data is loaded
  useEffect(() => {
    if (patient && patient.user) {
      form.reset({
        firstName: patient.user.firstName,
        lastName: patient.user.lastName,
        email: patient.user.email,
        birthDate: new Date(patient.birthDate).toISOString().split('T')[0],
        gender: patient.gender,
        address: patient.address || '',
        phone: patient.phone || '',
        ckdStage: patient.ckdStage
      });
    }
  }, [patient, form]);

  // Update patient mutation
  const updatePatientMutation = useMutation({
    mutationFn: async (data: PatientFormData) => {
      return apiRequest('PUT', `/api/patients/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: 'Patient mis à jour',
        description: 'Les informations du patient ont été enregistrées.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      setLocation('/patients');
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de mettre à jour le patient',
        variant: 'destructive',
      });
    }
  });

  // Update form when patient data is loaded
  useEffect(() => {
    if (patient && isEditing) {
      form.reset({
        firstName: patient.user.firstName,
        lastName: patient.user.lastName,
        email: patient.user.email,
        birthDate: new Date(patient.birthDate).toISOString().split('T')[0],
        gender: patient.gender as 'M' | 'F' | 'Autre',
        address: patient.address || '',
        phone: patient.phone || '',
        ckdStage: patient.ckdStage,
      });
    }
  }, [patient, isEditing, form]);

  // Create patient mutation
  const { user } = useAuth();

  const createPatientMutation = useMutation({
    mutationFn: async (data: PatientFormData) => {
      // Add doctor ID to patient data
      return apiRequest('POST', '/api/patients', {
        ...data,
        doctorId: user?.id
      });
    },
    onSuccess: () => {
      toast({
        title: 'Patient créé',
        description: 'Le nouveau patient a bien été enregistré.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      setLocation('/patients');
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de créer le patient',
        variant: 'destructive',
      });
    }
  });



  // Form submission
  const onSubmit = (data: PatientFormData) => {
    if (isEditing) {
      updatePatientMutation.mutate(data);
    } else {
      createPatientMutation.mutate(data);
    }
  };

  const isSaving = createPatientMutation.isPending || updatePatientMutation.isPending;

  // Chargement
  if (isEditing && patientLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-14 w-80" />
        <Skeleton className="h-[640px] rounded-xl" />
      </div>
    );
  }

  const p = patient as any;

  return (
    <div className="space-y-6">
      <PageHeader
        leading={
          <Button
            variant="outline"
            size="icon"
            className="mt-0.5 shrink-0"
            aria-label="Retour"
            onClick={() => setLocation('/patients')}
          >
            <ArrowLeft />
          </Button>
        }
        eyebrow={isEditing ? 'Dossier patient' : 'Nouveau dossier'}
        title={
          isEditing && p?.user
            ? `${p.user.firstName} ${p.user.lastName}`
            : isEditing
              ? 'Modifier le patient'
              : 'Ajouter un patient'
        }
        description={
          isEditing
            ? 'Mettez à jour les informations de ce patient.'
            : 'Renseignez les informations pour enregistrer un nouveau patient.'
        }
      />

      <Card className="overflow-hidden">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="divide-y">
              <FormSection
                icon={<User />}
                title="Identité"
                description="Nom, email de connexion et informations civiles du patient."
              >
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px]">Prénom</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex. Koffi" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px]">Nom</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex. Mensah" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px]">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="patient@exemple.com"
                          {...field}
                          disabled={isEditing} // L'email n'est pas modifiable
                        />
                      </FormControl>
                      {isEditing && (
                        <FormDescription className="text-xs">
                          L'email ne peut pas être modifié après l'inscription.
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px]">Date de naissance</FormLabel>
                      <FormControl>
                        <Input type="date" className="dark:[color-scheme:dark]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className="text-[13px]">Sexe</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                          className="grid grid-cols-3 gap-2"
                        >
                          {GENDER_OPTIONS.map((g) => (
                            <FormItem key={g.value} className="space-y-0">
                              <FormLabel className={GENDER_OPTION_CLASS}>
                                <FormControl>
                                  <RadioGroupItem value={g.value} />
                                </FormControl>
                                {g.label}
                              </FormLabel>
                            </FormItem>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormSection>

              <FormSection
                icon={<MapPin />}
                title="Coordonnées"
                description="Moyens de joindre le patient entre deux consultations."
              >
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px]">Téléphone</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+229 01 00 00 00 00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className="text-[13px]">Adresse</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Adresse complète (quartier, ville…)"
                          className="min-h-[88px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormSection>

              <FormSection
                icon={<HeartPulse />}
                title="Informations médicales"
                description="Le stade MRC conditionne la fréquence de suivi et les alertes."
              >
                <FormField
                  control={form.control}
                  name="ckdStage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px]">Stade MRC</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un stade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STAGE_OPTIONS.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              <span className="flex items-center gap-2">
                                <StageBadge stage={s.value} />
                                <span className="text-xs text-muted-foreground">{s.hint}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormSection>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t bg-muted/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
              <Button type="button" variant="outline" onClick={() => setLocation('/patients')}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
                {isEditing ? 'Enregistrer les modifications' : 'Créer le patient'}
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}

const GENDER_OPTIONS = [
  { value: 'M', label: 'Homme' },
  { value: 'F', label: 'Femme' },
  { value: 'Autre', label: 'Autre' },
];

const GENDER_OPTION_CLASS = cn(
  'flex h-10 cursor-pointer items-center gap-2.5 rounded-lg border bg-background px-3 text-sm font-normal shadow-xs transition-colors hover:bg-muted/50',
  'has-[[data-state=checked]]:border-primary/60 has-[[data-state=checked]]:bg-primary/5',
);

const STAGE_OPTIONS = [
  { value: 'Stage 1', hint: 'DFG ≥ 90' },
  { value: 'Stage 2', hint: 'DFG 60–89' },
  { value: 'Stage 3A', hint: 'DFG 45–59' },
  { value: 'Stage 3B', hint: 'DFG 30–44' },
  { value: 'Stage 4', hint: 'DFG 15–29' },
  { value: 'Stage 5', hint: 'DFG < 15' },
];

function FormSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-6 p-5 sm:p-6 md:grid-cols-3">
      <div className="space-y-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20 [&_svg]:h-[18px] [&_svg]:w-[18px]">
          {icon}
        </div>
        <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="grid content-start gap-4 sm:grid-cols-2 md:col-span-2">{children}</div>
    </section>
  );
}
