import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader as LucideLoader } from 'lucide-react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader, PageLoader } from '@/components/ui/loader';
import { PatientFormData, Patient } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';

interface PatientAddEditProps {
  id?: string;
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
});

export default function PatientAddEdit({ id }: PatientAddEditProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!id;
  const patientId = isEditing ? parseInt(id) : undefined;

  // Define form
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

  // Fetch patient data if editing
  const { data: patient, isLoading: patientLoading } = useQuery<Patient>({
    queryKey: [`/api/patients/${id}`],
    enabled: isEditing,
    onSuccess: (data) => {
      if (data) {
        // Récupération des données depuis la table users
        const userData = data.user;
        const patientData = data;

        form.reset({
          firstName: userData?.firstName || '',
          lastName: userData?.lastName || '',
          email: userData?.email || '',
          birthDate: patientData.birthDate ? new Date(patientData.birthDate).toISOString().split('T')[0] : '',
          gender: patientData.gender || '',
          address: patientData.address || '',
          phone: patientData.phone || '',
          ckdStage: patientData.ckdStage || ''
        });
      }
    }
  });


  // Update form when patient data is loaded
  useEffect(() => {
    if (patient && patient.user) {
      form.reset({
        firstName: patient.user.firstName,
        lastName: patient.user.lastName,
        email: patient.user.email,
        birthDate: new Date(patient.birthDate).toISOString().split('T')[0],
        gender: patient.gender,
        address: patient.address || '',
        phone: patient.phone || '',
        ckdStage: patient.ckdStage
      });
    }
  }, [patient, form]);

  // Update patient mutation
  const updatePatientMutation = useMutation({
    mutationFn: async (data: PatientFormData) => {
      return apiRequest('PUT', `/api/patients/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Patient updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      setLocation('/patients');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update patient',
        variant: 'destructive',
      });
    }
  });

  // Update form when patient data is loaded
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

  // Create patient mutation
  const { user } = useAuth();

  const createPatientMutation = useMutation({
    mutationFn: async (data: PatientFormData) => {
      // Add doctor ID to patient data
      return apiRequest('POST', '/api/patients', {
        ...data,
        doctorId: user?.id
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Patient has been created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      setLocation('/patients');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create patient',
        variant: 'destructive',
      });
    }
  });



  // Form submission
  const onSubmit = (data: PatientFormData) => {
    if (isEditing) {
      updatePatientMutation.mutate(data);
    } else {
      createPatientMutation.mutate(data);
    }
  };

  // Loading state
  if (isEditing && patientLoading) {
    return <PageLoader />;
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setLocation('/patients')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900">
          {isEditing ? 'Edit Patient' : 'Add New Patient'}
        </h1>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Patient Information' : 'New Patient Registration'}</CardTitle>
          <CardDescription>
            {isEditing 
              ? 'Update the information for this patient'
              : 'Enter the details to register a new patient'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Personal Information</h3>
                <Separator className="my-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter first name" {...field} />
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
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter last name" {...field} />
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
                          <Input 
                            placeholder="Enter email address" 
                            {...field} 
                            disabled={isEditing} // Email should not be editable
                          />
                        </FormControl>
                        {isEditing && (
                          <FormDescription>
                            Email cannot be changed after registration
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
                        <FormLabel>Birth Date</FormLabel>
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
                        <FormLabel>Gender</FormLabel>
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
                              <FormLabel className="font-normal">Male</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="F" />
                              </FormControl>
                              <FormLabel className="font-normal">Female</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Autre" />
                              </FormControl>
                              <FormLabel className="font-normal">Other</FormLabel>
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
                <h3 className="text-lg font-medium">Contact Information</h3>
                <Separator className="my-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} />
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
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter full address" 
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
                <h3 className="text-lg font-medium">Medical Information</h3>
                <Separator className="my-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="ckdStage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CKD Stage</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select CKD stage" />
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
              </div>

              <CardFooter className="flex justify-between px-0 pb-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation('/patients')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createPatientMutation.isPending || updatePatientMutation.isPending}
                >
                  {(createPatientMutation.isPending || updatePatientMutation.isPending) && (
                    <Loader color="white" size="sm" className="mr-2" />
                  )}
                  {isEditing ? 'Update Patient' : 'Create Patient'}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}