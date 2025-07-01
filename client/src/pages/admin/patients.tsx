import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { PlusCircle, Trash2, Edit, Search } from 'lucide-react';

import AdminPatientDialog from '@/components/admin/patient-dialog';


export default function AdminPatientsPage() {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addEditDialogOpen, setAddEditDialogOpen] = useState(false); // Added state for the dialog

  const { data: patients, isLoading, refetch } = useQuery({
    queryKey: ['admin-patients'],
    queryFn: () => apiRequest('GET', '/api/admin/patients').then(res => res.json())
  });

  const handleDelete = async (patientId: string) => {
    try {
      await apiRequest('DELETE', `/api/admin/patients/${patientId}`);
      await refetch();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const filteredPatients = patients?.filter((patient: any) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      patient.user.firstName.toLowerCase().includes(searchLower) ||
      patient.user.lastName.toLowerCase().includes(searchLower) ||
      patient.user.email.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Patients</h1>
        <Button onClick={() => setAddEditDialogOpen(true)}> {/* Open the admin dialog */}
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter un patient
        </Button>
      </div>

      <Card className="mt-6">
        <CardHeader className="pb-4">
          <CardTitle>Liste des Patients</CardTitle>
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="search"
                placeholder="Rechercher un patient..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Médecin Traitant</TableHead>
                  <TableHead>Stade CKD</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients?.map((patient: any) => (
                  <TableRow key={patient._id}>
                    <TableCell className="font-medium">
                      {patient.user.firstName} {patient.user.lastName}
                    </TableCell>
                    <TableCell>{patient.user.email}</TableCell>
                    <TableCell>
                      {patient.doctor?.user ? (
                        `Dr. ${patient.doctor.user.firstName} ${patient.doctor.user.lastName}`
                      ) : (
                        <span className="text-gray-400">Non assigné</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        Stade {patient.ckdStage}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => {setAddEditDialogOpen(true); setSelectedPatient(patient);}}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => {
                            setSelectedPatient(patient);
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
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <Alert>
            <AlertDescription>
              Êtes-vous sûr de vouloir supprimer ce patient ? Cette action est irréversible.
            </AlertDescription>
          </Alert>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedPatient && handleDelete(selectedPatient._id)}
            >
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <AdminPatientDialog 
        isOpen={addEditDialogOpen}
        onClose={() => {
          setAddEditDialogOpen(false);
          setSelectedPatient(undefined);
        }}
        patient={selectedPatient}
      />
    </div>
  );
}