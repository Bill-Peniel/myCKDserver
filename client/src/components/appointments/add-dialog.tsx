import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CalendarPlus, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader } from '@/components/ui/loader';
import { UserAvatar } from '@/components/kit';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';

const formSchema = z.object({
  patientId: z.string().min(1, { message: 'Veuillez sélectionner un patient' }),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Veuillez entrer une date valide (AAAA-MM-JJ)' }),
  appointmentTime: z.string().regex(/^\d{2}:\d{2}$/, { message: 'Veuillez entrer une heure valide (HH:MM)' }),
  purpose: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof formSchema>;

const TIME_SLOTS = ['08:30', '09:00', '10:30', '14:00', '15:30'];

// Prochain créneau par défaut : aujourd'hui 09:00, ou demain si l'heure est passée (date locale)
function defaultSlot() {
  const d = new Date();
  if (d.getHours() >= 9) d.setDate(d.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  return { appointmentDate: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, appointmentTime: '09:00' };
}
const PURPOSES = ['Suivi trimestriel', 'Bilan sanguin', 'Résultats d\'analyses', 'Consultation de contrôle'];

interface AddAppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddAppointmentDialog({ isOpen, onClose }: AddAppointmentDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: patients, isLoading: patientsLoading } = useQuery<any[]>({
    queryKey: ['/api/patients'],
  });

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: '',
      ...defaultSlot(),
      purpose: '',
    },
  });

  // Réinitialise le formulaire à la fermeture
  useEffect(() => {
    if (!isOpen) {
      form.reset({
        patientId: '',
        ...defaultSlot(),
        purpose: ''
      });
    }
  }, [isOpen, form]);

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormValues) => {
      // Validation des données
      if (!data.patientId) {
        throw new Error('Veuillez sélectionner un patient');
      }
      if (!data.appointmentDate) {
        throw new Error('Veuillez choisir une date');
      }
      if (!data.appointmentTime) {
        throw new Error('Veuillez choisir une heure');
      }
      if (!data.purpose) {
        throw new Error('Veuillez indiquer le motif du rendez-vous');
      }

      const dateTime = new Date(`${data.appointmentDate}T${data.appointmentTime}`);

      // Vérifier si la date est dans le passé
      if (dateTime < new Date()) {
        throw new Error('La date du rendez-vous ne peut pas être dans le passé');
      }

      const response = await apiRequest('POST', '/api/appointments', {
        patientId: data.patientId,
        appointmentDate: dateTime.toISOString(),
        purpose: data.purpose.trim()
      });

      return response;
    },
    onSuccess: () => {
      toast({
        title: 'Rendez-vous programmé',
        description: 'Le rendez-vous a été programmé avec succès',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      onClose();
      form.reset();
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Échec de la programmation du rendez-vous',
        variant: 'destructive',
      });
    }
  });

  const onSubmit = (data: AppointmentFormValues) => {
    createAppointmentMutation.mutate(data);
  };

  const isPastDate = (date: string, time: string) => {
    const selectedDate = new Date(`${date}T${time}`);
    return selectedDate < new Date();
  };

  const watchDate = form.watch('appointmentDate');
  const watchTime = form.watch('appointmentTime');
  const watchPurpose = form.watch('purpose');

  const preview = new Date(`${watchDate}T${watchTime}`);
  const previewValid = !Number.isNaN(preview.getTime());

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
            <CalendarPlus className="h-[18px] w-[18px]" />
          </div>
          <DialogTitle>Programmer un rendez-vous</DialogTitle>
          <DialogDescription>
            Planifiez une consultation avec l'un de vos patients.
          </DialogDescription>
        </DialogHeader>

        {patientsLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
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
                          <SelectItem key={patient._id} value={patient._id.toString()}>
                            <span className="flex items-center gap-2">
                              <UserAvatar firstName={patient.user.firstName} lastName={patient.user.lastName} size="xs" />
                              {patient.user.firstName} {patient.user.lastName}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="appointmentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px]">Date</FormLabel>
                      <FormControl>
                        <Input type="date" className="dark:[color-scheme:dark]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="appointmentTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px]">Heure</FormLabel>
                      <FormControl>
                        <Input type="time" className="dark:[color-scheme:dark]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-xs text-muted-foreground">Créneaux :</span>
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => form.setValue('appointmentTime', slot, { shouldValidate: true })}
                    className={cn(
                      'tabular rounded-md border px-2 py-0.5 text-xs font-medium transition-colors',
                      watchTime === slot
                        ? 'border-primary/30 bg-primary/10 text-primary'
                        : 'bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
                    )}
                  >
                    {slot}
                  </button>
                ))}
              </div>

              {isPastDate(watchDate, watchTime) && (
                <div className="flex items-start gap-2.5 rounded-lg border border-warning/25 bg-warning/10 px-3 py-2.5 text-[13px] text-warning">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>Attention : vous programmez un rendez-vous dans le passé.</p>
                </div>
              )}

              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px]">Motif</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Décrivez le motif de ce rendez-vous"
                        className="h-20 resize-none"
                        {...field}
                      />
                    </FormControl>
                    <div className="flex flex-wrap gap-1.5">
                      {PURPOSES.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => form.setValue('purpose', p, { shouldValidate: true })}
                          className={cn(
                            'rounded-full border px-2.5 py-0.5 text-xs transition-colors',
                            watchPurpose === p
                              ? 'border-primary/30 bg-primary/10 text-primary'
                              : 'bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
                          )}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-2.5 rounded-lg border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                <p>
                  {previewValid ? (
                    <>
                      Le{' '}
                      <span className="font-medium text-foreground">
                        {preview.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à{' '}
                        {preview.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {' '}· le patient recevra un e-mail de confirmation.
                    </>
                  ) : (
                    'Le patient recevra un e-mail de confirmation.'
                  )}
                </p>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Annuler
                </Button>
                <Button type="submit" disabled={createAppointmentMutation.isPending}>
                  {createAppointmentMutation.isPending && <Loader color="white" size="sm" />}
                  Programmer le rendez-vous
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
