import { useEffect, type ReactNode } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Check, Loader2, UserPen, UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PatientFormData, Patient } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';
import { cn, getCKDStageColor, getCKDStageLabel } from '@/lib/utils';

interface AdminPatientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: Patient;
}

const formSchema = z.object({
  firstName: z.string().min(2, { message: 'Le prénom doit comporter au moins 2 caractères' }),
  lastName: z.string().min(2, { message: 'Le nom doit comporter au moins 2 caractères' }),
  email: z.string().email({ message: 'Veuillez saisir une adresse e-mail valide' }),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Veuillez saisir une date valide (AAAA-MM-JJ)' }),
  gender: z.enum(['M', 'F', 'Autre'], { required_error: 'Veuillez sélectionner un genre' }),
  address: z.string().optional(),
  phone: z.string().optional(),
  ckdStage: z.enum(['Stage 1', 'Stage 2', 'Stage 3A', 'Stage 3B', 'Stage 4', 'Stage 5'], { required_error: 'Veuillez sélectionner un stade MRC' }),
  doctorId: z.string({ required_error: 'Veuillez sélectionner un médecin' }),
});

const STAGES = ['Stage 1', 'Stage 2', 'Stage 3A', 'Stage 3B', 'Stage 4', 'Stage 5'];
const GENDERS = [
  { value: 'M', label: 'Masculin' },
  { value: 'F', label: 'Féminin' },
  { value: 'Autre', label: 'Autre' },
];
const labelCls = 'text-[13px] font-medium';

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 md:col-span-2">{children}</div>
    </section>
  );
}

export default function AdminPatientDialog({ isOpen, onClose, patient }: AdminPatientDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!patient;

  const { data: doctors } = useQuery({
    queryKey: ['admin-doctors'],
    queryFn: () => apiRequest('GET', '/api/admin/doctors').then(res => res.json())
  });

  const form = useForm<PatientFormData>({
    resolver: zodResolver(formSchema),
    // Valeurs initiales toujours définies (champs contrôlés), remplacées par reset() en édition
    defaultValues: {
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
        doctorId: patient.doctor?._id ?? (patient.doctorId != null ? String(patient.doctorId) : undefined),
      });
    }
  }, [patient, isEditing, form]);

  const createPatientMutation = useMutation({
    mutationFn: async (data: PatientFormData) => {
      return apiRequest('POST', '/api/admin/patients', data);
    },
    onSuccess: () => {
      toast({
        title: 'Patient créé',
        description: 'Le dossier patient a été créé avec succès.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-patients'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de créer le patient',
        variant: 'destructive',
      });
    }
  });

  const updatePatientMutation = useMutation({
    mutationFn: async (data: PatientFormData) => {
      return apiRequest('PUT', `/api/admin/patients/${patient?._id}`, data);
    },
    onSuccess: () => {
      toast({
        title: 'Patient mis à jour',
        description: 'Les informations du patient ont été enregistrées.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-patients'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de mettre à jour le patient',
        variant: 'destructive',
      });
    }
  });

  const onSubmit = (data: PatientFormData) => {
    if (isEditing) {
      updatePatientMutation.mutate(data);
    } else {
      createPatientMutation.mutate(data);
    }
  };

  const isPending = createPatientMutation.isPending || updatePatientMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader className="flex-row items-start gap-3 space-y-0 text-left">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
            {isEditing ? <UserPen className="h-[18px] w-[18px]" /> : <UserPlus className="h-[18px] w-[18px]" />}
          </span>
          <div className="space-y-1.5">
            <DialogTitle>{isEditing ? 'Modifier le patient' : 'Ajouter un patient'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Mettez à jour les informations de ce patient.'
                : 'Saisissez les informations pour créer un nouveau dossier patient.'}
            </DialogDescription>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Section title="Identité" description="État civil du patient.">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelCls}>Prénom</FormLabel>
                    <FormControl>
                      <Input placeholder="Prénom" {...field} />
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
                    <FormLabel className={labelCls}>Nom</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelCls}>Date de naissance</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelCls}>Genre</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-3 gap-1 rounded-lg border bg-muted/50 p-1"
                      >
                        {GENDERS.map((g) => (
                          <FormItem key={g.value} className="space-y-0">
                            <FormControl>
                              <RadioGroupItem value={g.value} className="peer sr-only" />
                            </FormControl>
                            <FormLabel
                              className={cn(
                                'flex h-7 cursor-pointer items-center justify-center rounded-md text-[13px] font-normal text-muted-foreground transition-colors hover:text-foreground',
                                field.value === g.value && 'bg-background font-medium text-foreground shadow-sm',
                              )}
                            >
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
            </Section>

            <div className="h-px bg-border" />

            <Section title="Coordonnées" description="Moyens de contact du patient.">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelCls}>Adresse e-mail</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="patient@exemple.fr" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelCls}>Téléphone</FormLabel>
                    <FormControl>
                      <Input placeholder="+229 00 00 00 00" {...field} />
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
                    <FormLabel className={labelCls}>Adresse</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Adresse complète"
                        className="min-h-[72px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Section>

            <div className="h-px bg-border" />

            <Section title="Suivi médical" description="Stade de la MRC et médecin référent.">
              <FormField
                control={form.control}
                name="ckdStage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelCls}>Stade MRC</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le stade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STAGES.map((s) => (
                          <SelectItem key={s} value={s}>
                            <span className="flex items-center gap-2">
                              <span className={cn('h-2 w-2 rounded-full', getCKDStageColor(s).dot)} />
                              {getCKDStageLabel(s)}
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
                name="doctorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelCls}>Médecin référent</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un médecin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {doctors?.map((doctor: any) => (
                          <SelectItem key={doctor._id} value={doctor._id}>
                            Dr. {doctor.user.firstName} {doctor.user.lastName}
                            {doctor.specialty && <span className="text-muted-foreground"> · {doctor.specialty}</span>}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Section>

            <DialogFooter className="gap-2 border-t pt-4 sm:space-x-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : <Check />}
                {isEditing ? 'Enregistrer' : 'Créer le patient'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
