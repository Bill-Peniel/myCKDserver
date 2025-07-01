import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader } from '@/components/ui/loader';
import { Patient, Doctor, LabTest, LabResultFormData } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';

const formSchema = z.object({
  patientId: z.string().min(1, { message: 'Please select a patient' }),
  labTestId: z.string().min(1, { message: 'Please select a test' }),
  resultValue: z.string().min(1, { message: 'Please enter a result value' }),
  resultDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Please enter a valid date (YYYY-MM-DD)' }),
});

export default function LabResultAdd() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: patients, isLoading: patientsLoading } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
  });

  const { data: labTests, isLoading: labTestsLoading } = useQuery<LabTest[]>({
    queryKey: ['/api/lab-tests'],
    enabled: true
  });

  const { user } = useAuth();

  // Define form
  const form = useForm<LabResultFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: '',
      labTestId: '',
      resultValue: '',
      resultDate: new Date().toISOString().split('T')[0],
    },
  });

  // Plus de filtrage des tests par sexe
  const filteredTests = labTests;

  // Selected test details for showing units and normal range
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);

  // Watch lab test ID to update selected test
  const watchLabTestId = form.watch('labTestId');

  // Update selected test when lab test ID changes
  if (watchLabTestId && labTests && (!selectedTest || selectedTest._id.toString() !== watchLabTestId)) {
    const test = labTests.find(t => t._id.toString() === watchLabTestId);
    if (test) {
      setSelectedTest(test);
    }
  }

  // Create lab result mutation
  const createLabResultMutation = useMutation({
    mutationFn: async (data: LabResultFormData) => {
      return apiRequest('POST', '/api/patient-lab-results', {
        patientId: data.patientId,
        doctorId: user?.id,
        labTestId: data.labTestId,
        resultValue: parseFloat(data.resultValue),
        resultDate: data.resultDate
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Lab result has been added successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/patient-lab-results'] });
      setLocation('/lab-results');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add lab result',
        variant: 'destructive',
      });
    }
  });

  // Form submission
  const onSubmit = (data: LabResultFormData) => {
    createLabResultMutation.mutate(data);
  };

  const isLoading = patientsLoading || labTestsLoading;

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setLocation('/lab-results')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900">Add Lab Result</h1>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>New Lab Result Entry</CardTitle>
          <CardDescription>
            Record a new laboratory test result for a patient
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
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
                            <SelectValue placeholder="Select a patient" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {patients?.map((patient) => (
                            <SelectItem key={patient._id} value={patient._id}>
                              {patient.user.firstName} {patient.user.lastName} ({patient.gender})
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
                  name="labTestId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Test Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a test" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[300px]">
                          {filteredTests?.map((test) => (
                            <SelectItem 
                              key={test._id} 
                              value={test._id.toString()}
                              className="flex flex-col items-start py-3"
                            >
                              <div className="font-medium">{test.testName}</div>
                              {test.description && (
                                <div className="text-sm text-gray-500 mt-1">
                                  {test.description}
                                </div>
                              )}
                              {test.unit && (
                                <div className="text-xs text-gray-400 mt-1">
                                  Unité: {test.unit}
                                </div>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedTest && selectedTest.description && (
                        <FormDescription>
                          {selectedTest.description}
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="resultValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Result Value</FormLabel>
                      <FormControl>
                        <div className="flex">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Enter result value"
                            {...field}
                            className="rounded-r-none"
                          />
                          <div className="flex items-center justify-center px-3 border border-l-0 rounded-r-md bg-gray-50 text-gray-500">
                            {selectedTest?.unit || ''}
                          </div>
                        </div>
                      </FormControl>
                      {selectedTest && (selectedTest.normalMin !== null || selectedTest.normalMax !== null) && (
                        <FormDescription>
                          Normal range: {selectedTest.normalMin || 'N/A'} - {selectedTest.normalMax || 'N/A'} {selectedTest.unit || ''}
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="resultDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Test Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <CardFooter className="flex justify-between px-0 pb-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation('/lab-results')}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createLabResultMutation.isPending}
                  >
                    {createLabResultMutation.isPending && (
                      <Loader color="white" size="sm" className="mr-2" />
                    )}
                    Save Result
                  </Button>
                </CardFooter>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}