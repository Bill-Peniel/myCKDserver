import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { ArrowLeft, Calendar, Phone, MapPin, Activity, FileText, Beaker, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Patient, PatientLabResult } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getCKDStageColor, calculateAge, formatDate, formatTime } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { GenerateReport } from '@/components/patient-report/generate-report';

interface PatientDetailsProps {
  id: string;
}

export default function PatientDetails({ id }: PatientDetailsProps) {
  const [, setLocation] = useLocation();

  const { data: patient, isLoading: patientLoading } = useQuery<Patient>({
    queryKey: [`/api/patients/${id}`],
  });

  const { data: labResults = [], isLoading: resultsLoading } = useQuery<PatientLabResult[]>({
    queryKey: [`/api/patient-lab-results/patient/${id}`],
    enabled: !!id,
  });

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery<Appointment[]>({
    queryKey: [`/api/appointments`],
    enabled: !!id,
    select: (data) => data.filter(apt => apt.patient._id === id)
  });

  if (patientLoading || resultsLoading || appointmentsLoading) {
    return <PageLoader />;
  }

  if (!patient) {
    return <div>Patient not found</div>;
  }

  const stageColors = getCKDStageColor(patient.ckdStage);

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setLocation('/patients')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900">
              {patient.user.firstName} {patient.user.lastName}
            </h1>
            <p className="text-gray-500">ID: P-{patient._id.toString().padStart(5, '0')}</p>
          </div>
          <GenerateReport patient={patient} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>Informations Personnelles</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-y-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-base font-medium">{patient.user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Téléphone</p>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <p className="text-base font-medium">{patient.phone || 'Non renseigné'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Âge/Genre</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="text-base font-medium">{calculateAge(patient.birthDate)} ans / {patient.gender}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Date de Naissance</p>
                <p className="text-base font-medium">{formatDate(patient.birthDate)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-gray-500">Adresse</p>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <p className="text-base font-medium">{patient.address || 'Non renseignée'}</p>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div>
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">État de Santé</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Stade MRC</p>
                  <Badge variant="outline" className={`${stageColors.bg} ${stageColors.text} mt-1 text-sm`}>
                    {patient.ckdStage}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardHeader className="border-b">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              <CardTitle>Suivi Médical</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Médecin Traitant</p>
                <p className="text-base font-medium">{patient.doctor?.user?.firstName} {patient.doctor?.user?.lastName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Date de Création</p>
                <p className="text-base font-medium">{formatDate(patient.createdAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
        <CardHeader className="border-b">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle>Rendez-vous</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Heure</TableHead>
                <TableHead>Motif</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500">
                    Aucun rendez-vous programmé
                  </TableCell>
                </TableRow>
              ) : (
                appointments?.map((appointment) => (
                  <TableRow key={appointment._id}>
                    <TableCell>{formatDate(appointment.appointmentDate)}</TableCell>
                    <TableCell>{formatTime(appointment.appointmentDate)}</TableCell>
                    <TableCell>{appointment.purpose}</TableCell>
                    <TableCell>
                      {appointment.doctorStatus === 'pending' && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-600">
                          En attente
                        </Badge>
                      )}
                      {appointment.doctorStatus === 'confirmed' && (
                        <Badge variant="outline" className="bg-green-50 text-green-600">
                          Confirmé
                        </Badge>
                      )}
                      {appointment.doctorStatus === 'cancelled' && (
                        <Badge variant="outline" className="bg-red-50 text-red-600">
                          Annulé
                        </Badge>
                      )}
                      {appointment.doctorStatus === 'completed' && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-600">
                          Terminé
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
        <CardHeader className="border-b">
          <div className="flex items-center gap-2">
            <Beaker className="h-5 w-5 text-primary" />
            <CardTitle>Résultats de Laboratoire</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {labResults.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Aucun résultat de laboratoire disponible</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Test</TableHead>
                  <TableHead>Résultat</TableHead>
                  <TableHead>Unité</TableHead>
                  <TableHead>Commentaire</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {labResults.map((result) => (
                  <TableRow key={result._id}>
                    <TableCell className="font-medium">{formatDate(result.resultDate)}</TableCell>
                    <TableCell>{result.labTest.testName}</TableCell>
                    <TableCell>{result.resultValue}</TableCell>
                    <TableCell>{result.labTest.unit}</TableCell>
                    <TableCell>
                      {(() => {
                        const value = parseFloat(result.resultValue);
                        const min = result.labTest.normalMin;
                        const max = result.labTest.normalMax;

                        if (min && max) {
                          const normalValue = (max + min) / 2;
                          const deviation = Math.abs((value - normalValue) / normalValue);

                          if (value < min) {
                            if (deviation > 0.3) {
                              return <Badge variant="destructive" className="bg-red-100 text-red-700 font-bold">⚠️↓ Dangereusement bas</Badge>;
                            } else {
                              return <Badge variant="outline" className="bg-orange-50 text-orange-600">↓ En dessous de la normale</Badge>;
                            }
                          } else if (value > max) {
                            if (deviation > 0.3) {
                              return <Badge variant="destructive" className="bg-red-100 text-red-700 font-bold">⚠️↑ Dangereusement élevé</Badge>;
                            } else {
                              return <Badge variant="outline" className="bg-red-50 text-red-600">↑ Au-dessus de la normale</Badge>;
                            }
                          } else {
                            return <Badge variant="outline" className="bg-green-50 text-green-600">✓ Normal</Badge>;
                          }
                        }
                        return <Badge variant="secondary">Non défini</Badge>;
                      })()}
                    </TableCell>
                    <TableCell className="text-gray-500">{result.comment || ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}