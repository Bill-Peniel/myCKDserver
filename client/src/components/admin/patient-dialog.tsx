
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader } from '@/components/ui/loader';
import { PatientFormData, Patient } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';

interface AdminPatientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: Patient;
}

const formSchema = z.object({
  firstName: z.string().min(2, { message: 'First name must be at least 2 characters' }),
  lastName: z.string().min(2, { message: 'Last name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Please enter a valid date (YYYY-MM-DD)' }),
  gender: z.enum(['M', 'F', 'Autre'], { required_error: 'Please select a gender' }),
  address: z.string().optional(),
  phone: z.string().optional(),
  ckdStage: z.enum(['Stage 1', 'Stage 2', 'Stage 3A', 'Stage 3B', 'Stage 4', 'Stage 5'], { required_error: 'Please select a CKD stage' }),
  doctorId: z.string({ required_error: 'Please select a doctor' }),
});

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
      return apiRequest('POST', '/api/admin/patients', data);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Patient has been created successfully',
      });
      queryClient.invalidateQueries(['admin-patients']);
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create patient',
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
        title: 'Success',
        description: 'Patient updated successfully',
      });
      queryClient.invalidateQueries(['admin-patients']);
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update patient',
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Modifier le Patient' : 'Ajouter un Nouveau Patient'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Mettre à jour les informations de ce patient'
              : 'Saisir les détails pour enregistrer un nouveau patient'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Informations Personnelles</h3>
              <Separator className="my-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom</FormLabel>
                      <FormControl>
                        <Input placeholder="Entrer le prénom" {...field} />
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
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input placeholder="Entrer le nom" {...field} />
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email address" {...field} />
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
                      <FormLabel>Date de naissance</FormLabel>
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
                      <FormLabel>Genre</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                          className="flex gap-4"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="M" />
                            </FormControl>
                            <FormLabel className="font-normal">Masculin</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="F" />
                            </FormControl>
                            <FormLabel className="font-normal">Féminin</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Autre" />
                            </FormControl>
                            <FormLabel className="font-normal">Autre</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium">Informations de Contact</h3>
              <Separator className="my-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <Input placeholder="Entrer le numéro de téléphone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresse</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Entrer l'adresse complète" 
                            className="resize-none" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium">Information Médicale</h3>
              <Separator className="my-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="ckdStage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stade CKD</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner le stade CKD" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Stage 1">Stage 1</SelectItem>
                          <SelectItem value="Stage 2">Stage 2</SelectItem>
                          <SelectItem value="Stage 3A">Stage 3A</SelectItem>
                          <SelectItem value="Stage 3B">Stage 3B</SelectItem>
                          <SelectItem value="Stage 4">Stage 4</SelectItem>
                          <SelectItem value="Stage 5">Stage 5</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="doctorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Médecin Traitant</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un médecin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {doctors?.map((doctor) => (
                          <SelectItem key={doctor._id} value={doctor._id}>
                            Dr. {doctor.user.firstName} {doctor.user.lastName} - {doctor.specialty}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                disabled={createPatientMutation.isPending || updatePatientMutation.isPending}
              >
                {(createPatientMutation.isPending || updatePatientMutation.isPending) && (
                  <Loader color="white" size="sm" className="mr-2" />
                )}
                {isEditing ? 'Mettre à jour' : 'Créer le Patient'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
