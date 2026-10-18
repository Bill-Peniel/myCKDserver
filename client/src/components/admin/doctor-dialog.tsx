import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, Stethoscope, UserPen } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form, FormControl, FormDescription, FormField, FormItem,
  FormLabel, FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CredentialsDialog, readInvitation, type DoctorCredentials } from '@/components/admin/credentials-dialog';

interface DoctorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  doctor?: any;
}

const labelCls = 'text-[13px] font-medium';

export default function DoctorDialog({ isOpen, onClose, doctor }: DoctorDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!doctor;
  const [credentials, setCredentials] = useState<DoctorCredentials | null>(null);

  const form = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      specialty: '',
      hospital: ''
    }
  });

  useEffect(() => {
    if (doctor && isEditing) {
      form.reset({
        firstName: doctor.user.firstName,
        lastName: doctor.user.lastName,
        email: doctor.user.email,
        specialty: doctor.specialty,
        hospital: doctor.hospital
      });
    }
  }, [doctor, isEditing, form]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = isEditing
        ? await apiRequest('PUT', `/api/admin/doctors/${doctor._id}`, data)
        : await apiRequest('POST', '/api/admin/doctors', data);
      return res.json();
    },
    onSuccess: (saved: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      if (isEditing) {
        toast({ title: 'Médecin modifié avec succès' });
      } else if (saved?.invitation?.emailSent) {
        toast({ title: 'Médecin ajouté', description: `Ses identifiants ont été envoyés à ${saved.user.email}.` });
      } else {
        toast({ title: 'Médecin ajouté', description: "L'e-mail n'a pas pu être envoyé : transmettez les identifiants affichés." });
        setCredentials(readInvitation(saved));
      }
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de l'enregistrement du médecin",
        variant: 'destructive'
      });
    }
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  return (
    <>
    <CredentialsDialog credentials={credentials} onClose={() => setCredentials(null)} />
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader className="flex-row items-start gap-3 space-y-0 text-left">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
            {isEditing ? <UserPen className="h-[18px] w-[18px]" /> : <Stethoscope className="h-[18px] w-[18px]" />}
          </span>
          <div className="space-y-1.5">
            <DialogTitle>
              {isEditing ? 'Modifier le médecin' : 'Ajouter un médecin'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Modifiez les informations du médecin.'
                : 'Le compte est créé et les identifiants de connexion sont envoyés au praticien par e-mail.'}
            </DialogDescription>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <section className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Identité</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelCls}>Prénom</FormLabel>
                      <FormControl>
                        <Input placeholder="Jean" {...field} />
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
                        <Input placeholder="Dupont" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className={labelCls}>Adresse e-mail</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="nom@hopital.fr" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <div className="h-px bg-border" />

            <section className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Exercice</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="specialty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelCls}>Spécialité</FormLabel>
                      <FormControl>
                        <Input placeholder="Néphrologie" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hospital"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelCls}>Hôpital</FormLabel>
                      <FormControl>
                        <Input placeholder="CHU de Cotonou" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {!isEditing && (
                <FormDescription className="text-xs">
                  Un mot de passe temporaire est généré automatiquement et envoyé à cette adresse e-mail, avec le lien de connexion.
                </FormDescription>
              )}
            </section>

            <DialogFooter className="gap-2 pt-1 sm:space-x-0">
              <Button variant="outline" type="button" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="animate-spin" /> : <Check />}
                {isEditing ? 'Enregistrer' : 'Ajouter le médecin'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    </>
  );
}
