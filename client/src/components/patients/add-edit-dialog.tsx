import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { StageBadge } from '@/components/kit';
import { cn } from '@/lib/utils';
import { PatientFormData, Patient } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';

interface AddEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: Patient;
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

const GENDER_OPTIONS = [
  { value: 'M', label: 'Homme' },
  { value: 'F', label: 'Femme' },
  { value: 'Autre', label: 'Autre' },
];

const STAGE_OPTIONS = [
  { value: 'Stage 1', hint: 'DFG ≥ 90' },
  { value: 'Stage 2', hint: 'DFG 60–89' },
  { value: 'Stage 3A', hint: 'DFG 45–59' },
  { value: 'Stage 3B', hint: 'DFG 30–44' },
  { value: 'Stage 4', hint: 'DFG 15–29' },
  { value: 'Stage 5', hint: 'DFG < 15' },
];

const GENDER_OPTION_CLASS = cn(
  'flex h-9 cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 text-sm font-normal shadow-xs transition-colors hover:bg-muted/50',
  'has-[[data-state=checked]]:border-primary/60 has-[[data-state=checked]]:bg-primary/5',
);

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 sm:col-span-2">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{children}</h3>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

export default function AddEditDialog({ isOpen, onClose, patient }: AddEditDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isEditing = !!patient;

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

  const createPatientMutation = useMutation({
    mutationFn: async (data: PatientFormData) => {
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
      // Invalider les requêtes des patients et du dashboard
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
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
      return apiRequest('PUT', `/api/patients/${patient?._id}`, data);
    },
    onSuccess: () => {
      toast({
        title: 'Patient mis à jour',
        description: 'Les informations du patient ont été enregistrées.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patient?._id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
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

  const isSaving = createPatientMutation.isPending || updatePatientMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20 [&_svg]:h-[18px] [&_svg]:w-[18px]">
              {isEditing ? <Save /> : <UserPlus />}
            </div>
            <div className="space-y-1 text-left">
              <DialogTitle>{isEditing ? 'Modifier le patient' : 'Ajouter un patient'}</DialogTitle>
              <DialogDescription>
                {isEditing
                  ? 'Mettez à jour les informations de ce patient.'
                  : 'Renseignez les informations pour enregistrer un nouveau patient.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <SectionTitle>Identité</SectionTitle>
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
                        disabled={isEditing}
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
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SectionTitle>Coordonnées</SectionTitle>
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
                        className="min-h-[72px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SectionTitle>Informations médicales</SectionTitle>
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
            </div>

            <DialogFooter className="gap-2 border-t pt-4 sm:gap-0">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="animate-spin" /> : isEditing ? <Save /> : <UserPlus />}
                {isEditing ? 'Enregistrer' : 'Créer le patient'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
