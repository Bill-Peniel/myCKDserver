import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader } from '@/components/ui/loader';
import { Patient, AppointmentFormData } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';

const formSchema = z.object({
  patientId: z.string().min(1, { message: 'Veuillez sélectionner un patient' }),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Veuillez entrer une date valide (AAAA-MM-JJ)' }),
  appointmentTime: z.string().regex(/^\d{2}:\d{2}$/, { message: 'Veuillez entrer une heure valide (HH:MM)' }),
  purpose: z.string().optional(),
});

interface AddAppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddAppointmentDialog({ isOpen, onClose }: AddAppointmentDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: patients, isLoading: patientsLoading } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
  });

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: '',
      appointmentDate: new Date().toISOString().split('T')[0],
      appointmentTime: '09:00',
      purpose: '',
    },
  });

  // Reset form when dialog is closed
  useEffect(() => {
    if (!isOpen) {
      form.reset({
        patientId: '',
        appointmentDate: new Date().toISOString().split('T')[0],
        appointmentTime: '09:00',
        purpose: ''
      });
    }
  }, [isOpen, form]);

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
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

      console.log('Patient sélectionné:', data.patientId);

      const dateTime = new Date(`${data.appointmentDate}T${data.appointmentTime}`);

      // Vérifier si la date est dans le passé
      if (dateTime < new Date()) {
        throw new Error('La date du rendez-vous ne peut pas être dans le passé');
      }

      // Envoyer la requête avec l'ID MongoDB
      const response = await apiRequest('POST', '/api/appointments', {
        patientId: data.patientId, // Utiliser l'ID MongoDB directement
        appointmentDate: dateTime.toISOString(),
        purpose: data.purpose.trim()
      });

      console.log('Réponse du serveur:', response);
      return response;
    },
    onSuccess: () => {
      toast({
        title: 'Succès',
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

  const onSubmit = (data: AppointmentFormData) => {
    createAppointmentMutation.mutate(data);
  };

  const isPastDate = (date: string, time: string) => {
    const selectedDate = new Date(`${date}T${time}`);
    return selectedDate < new Date();
  };

  const watchDate = form.watch('appointmentDate');
  const watchTime = form.watch('appointmentTime');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Programmer un rendez-vous</DialogTitle>
          <DialogDescription>
            Programmer un nouveau rendez-vous pour un patient
          </DialogDescription>
        </DialogHeader>

        {patientsLoading ? (
          <div className="h-60 flex items-center justify-center">
            <Loader size="lg" />
          </div>
        ) : (
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
                        {patients?.map((patient) => {
                          console.log('Patient dans la liste:', patient._id);
                          return (
                            <SelectItem 
                              key={patient._id} 
                              value={patient._id.toString()}
                            >
                              {`${patient.user.firstName} ${patient.user.lastName} (${patient._id})`}
                            </SelectItem>
                          );
                        })}
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
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
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
                      <FormLabel>Heure</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {isPastDate(watchDate, watchTime) && (
                <div className="rounded-md bg-yellow-50 p-4">
                  <div className="flex">
                    <div className="text-yellow-700">
                      <p>Attention : Vous programmez un rendez-vous dans le passé.</p>
                    </div>
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motif</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Décrivez le motif de ce rendez-vous"
                        className="resize-none h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Incluez tous les détails pertinents concernant le motif du rendez-vous.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                >
                  Annuler
                </Button>
                <Button 
                  type="submit"
                  disabled={createAppointmentMutation.isPending}
                >
                  {createAppointmentMutation.isPending && (
                    <Loader color="white" size="sm" className="mr-2" />
                  )}
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