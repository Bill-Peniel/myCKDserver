
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { PlusCircle, Trash2, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DoctorDialog from '@/components/admin/doctor-dialog';

export default function AdminDoctorsPage() {
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: doctors, isLoading } = useQuery({
    queryKey: ['admin-doctors'],
    queryFn: () => apiRequest('GET', '/api/admin/doctors').then(res => res.json())
  });

  const deleteMutation = useMutation({
    mutationFn: (doctorId: string) => apiRequest('DELETE', `/api/admin/doctors/${doctorId}`),
    onSuccess: () => {
      // Invalider les requêtes pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setIsDeleteDialogOpen(false);
      setSelectedDoctor(null);
      toast({
        title: 'Médecin supprimé avec succès'
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la suppression',
        variant: 'destructive'
      });
    }
  });

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des Médecins</h1>
        <Button onClick={() => {
          setSelectedDoctor(null);
          setIsAddEditDialogOpen(true);
        }}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter un médecin
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Médecins</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Spécialité</TableHead>
                <TableHead>Hôpital</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctors?.map((doctor: any) => (
                <TableRow key={doctor._id}>
                  <TableCell>{`${doctor.user.firstName} ${doctor.user.lastName}`}</TableCell>
                  <TableCell>{doctor.user.email}</TableCell>
                  <TableCell>{doctor.specialty}</TableCell>
                  <TableCell>{doctor.hospital}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedDoctor(doctor);
                          setIsAddEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => {
                          setSelectedDoctor(doctor);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <Alert>
            <AlertDescription>
              Êtes-vous sûr de vouloir supprimer ce médecin ? Cette action est irréversible.
            </AlertDescription>
          </Alert>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedDoctor && deleteMutation.mutate(selectedDoctor._id)}
            >
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DoctorDialog 
        isOpen={isAddEditDialogOpen}
        onClose={() => {
          setIsAddEditDialogOpen(false);
          setSelectedDoctor(null);
        }}
        doctor={selectedDoctor}
      />
    </div>
  );
}
