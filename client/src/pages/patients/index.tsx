import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useLocation } from 'wouter';
import AddEditDialog from '@/components/patients/add-edit-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, FileX, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AvatarName } from '@/components/ui/avatar-name';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Loader } from '@/components/ui/loader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Patient } from '@/lib/types';
import { getCKDStageColor, calculateAge } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';

export default function PatientsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [addEditDialogOpen, setAddEditDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | undefined>();
  const patientsPerPage = 10;

  const { data: patients, isLoading, refetch } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
  });

  const filteredPatients = patients?.filter(patient => {
    const matchesSearch = searchQuery ? (
      patient.user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.user.email.toLowerCase().includes(searchQuery.toLowerCase())
    ) : true;

    const matchesStage = filterStage === 'all' ? true : patient.ckdStage === filterStage;

    return matchesSearch && matchesStage;
  }) || [];

  // Calculate pagination
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);
  const startIndex = (currentPage - 1) * patientsPerPage;
  const paginatedPatients = filteredPatients.slice(startIndex, startIndex + patientsPerPage);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Reset to first page when searching
    setCurrentPage(1);
  };

  const handleDeletePatient = async (patient: Patient) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await apiRequest('DELETE', `/api/patients/${patient._id}`, {});
        toast({
          title: 'Patient deleted',
          description: 'The patient has been successfully deleted',
        });
        refetch();
      } catch (error) {
        console.error('Delete error:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete patient',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Patients</h1>
        <Button className="flex items-center gap-2" onClick={() => setAddEditDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          <span>Ajouter un patient</span>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Registre des Patients</CardTitle>
              <CardDescription>
                Gérer et consulter tous les patients enregistrés
              </CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <form onSubmit={handleSearch} className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search patients..."
                  className="pl-8 w-full sm:w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select
                  value={filterStage}
                  onValueChange={setFilterStage}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    <SelectItem value="Stage 1">Stage 1</SelectItem>
                    <SelectItem value="Stage 2">Stage 2</SelectItem>
                    <SelectItem value="Stage 3A">Stage 3A</SelectItem>
                    <SelectItem value="Stage 3B">Stage 3B</SelectItem>
                    <SelectItem value="Stage 4">Stage 4</SelectItem>
                    <SelectItem value="Stage 5">Stage 5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-96 flex items-center justify-center">
              <Loader size="lg" />
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center text-gray-500">
              <FileX className="h-12 w-12 mb-4" />
              <h3 className="text-lg font-medium">No patients found</h3>
              <p className="text-sm">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead key="patient">Patient</TableHead>
                      <TableHead key="id">ID</TableHead>
                      <TableHead key="age">Age/Gender</TableHead>
                      <TableHead key="stage">CKD Stage</TableHead>
                      <TableHead key="contact">Contact</TableHead>
                      <TableHead key="actions" className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPatients.map((patient) => (
                      <TableRow key={patient._id} className="hover:bg-gray-50">
                        <TableCell>
                          <AvatarName
                            firstName={patient.user.firstName}
                            lastName={patient.user.lastName}
                            showEmail
                            email={patient.user.email}
                            gender={patient.gender}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900">P-{patient._id.toString().padStart(5, '0')}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900">{calculateAge(patient.birthDate)} / {patient.gender}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${getCKDStageColor(patient.ckdStage).bg} ${getCKDStageColor(patient.ckdStage).text} px-2 py-1 text-xs`}>
                            {patient.ckdStage}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900">{patient.phone || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{patient.address || 'No address'}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/patients/${patient._id}`}>
                              <Button 
                                variant="default" 
                                size="sm"
                                className="mr-2"
                              >
                                Voir
                              </Button>
                            </Link>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedPatient(patient);
                                setAddEditDialogOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeletePatient(patient)}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-500">
                    Showing {startIndex + 1} to {Math.min(startIndex + patientsPerPage, filteredPatients.length)} of {filteredPatients.length} patients
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>

                      {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                        const page = i + 1;
                        return (
                          <PaginationItem key={i}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}

                      {totalPages > 5 && currentPage < totalPages - 2 && (
                        <PaginationItem>
                          <span className="flex h-9 w-9 items-center justify-center">...</span>
                        </PaginationItem>
                      )}

                      {totalPages > 5 && (
                        <PaginationItem>
                          <PaginationLink
                            onClick={() => setCurrentPage(totalPages)}
                            isActive={currentPage === totalPages}
                          >
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      )}

                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AddEditDialog 
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