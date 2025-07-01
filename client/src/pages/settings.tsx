import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Save, User, Lock, Building, Bell, Palette } from 'lucide-react';
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getAvatarColor } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { AvatarName } from '@/components/ui/avatar-name';
import { Loader } from '@/components/ui/loader';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Doctor } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';

const profileSchema = z.object({
  firstName: z.string().min(2, { message: 'First name must be at least 2 characters' }),
  lastName: z.string().min(2, { message: 'Last name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  specialty: z.string().optional(),
  hospital: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Current password is required' }),
  newPassword: z.string().min(6, { message: 'New password must be at least 6 characters' }),
  confirmPassword: z.string().min(6, { message: 'Confirm password must be at least 6 characters' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const notificationSchema = z.object({
  emailNotifications: z.boolean(),
  criticalAlertsOnly: z.boolean(),
  appointmentReminders: z.boolean(),
  labResultAlerts: z.boolean(),
});

const themeSchema = z.object({
  primaryColor: z.string(),
  variant: z.enum(['tint', 'vibrant']),
  appearance: z.enum(['light', 'dark', 'system']),
  radius: z.number(),
});


export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, setAuthState, logout } = useAuth();
  const [selectedTab, setSelectedTab] = useState('profile');

  // Get doctor details
  const { data: doctorDetails } = useQuery({
    queryKey: ['doctor', user?.id],
    queryFn: () => apiRequest.get(`/api/doctors/user/${user?.id}`).then(res => res.data),
    enabled: !!user && user.role === 'medecin'
  });

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      specialty: '',
      hospital: '',
    },
  });

  useEffect(() => {
    if (user && doctorDetails) {
      profileForm.reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        specialty: doctorDetails?.specialty || '',
        hospital: doctorDetails?.hospital || '',
      });
    }
  }, [user, doctorDetails]);

  // Password form
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Notification preferences form
  const notificationForm = useForm<z.infer<typeof notificationSchema>>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailNotifications: true,
      criticalAlertsOnly: false,
      appointmentReminders: true,
      labResultAlerts: true,
    },
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileSchema>) => {
      const response = await apiRequest('PUT', '/api/user/profile', data);
      return response;
    },
    onSuccess: async (data) => {
      // Récupérer les données auth actuelles
      const currentAuth = JSON.parse(localStorage.getItem('auth') || '{}');

      // Mettre à jour avec les nouvelles données
      const newAuth = {
        ...currentAuth,
        user: {
          ...currentAuth.user,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
        },
        userDetails: {
          ...currentAuth.userDetails,
          specialty: data.specialty,
          hospital: data.hospital,
        },
        isAuthenticated: true
      };

      // Sauvegarder et mettre à jour l'état
      localStorage.setItem('auth', JSON.stringify(newAuth));
      setAuthState(newAuth);

      // Rafraîchir les queries
      await queryClient.invalidateQueries();

      toast({
        title: 'Profil mis à jour',
        description: 'Vos informations ont été mises à jour avec succès',
      });

      // Déconnecter l'utilisateur
      await logout();

      // Rediriger vers la page de connexion après un court délai
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive',
      });
    }
  });

  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof passwordSchema>) => {
      // Mock implementation as we don't have a real change password endpoint
      return apiRequest('POST', '/api/user/change-password', data);
    },
    onSuccess: () => {
      toast({
        title: 'Password changed',
        description: 'Your password has been changed successfully',
      });
      passwordForm.reset({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to change password',
        variant: 'destructive',
      });
    }
  });

  // Notification preferences mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof notificationSchema>) => {
      // Mock implementation as we don't have a real update notifications endpoint
      return apiRequest('POST', '/api/user/notification-preferences', data);
    },
    onSuccess: () => {
      toast({
        title: 'Preferences updated',
        description: 'Your notification preferences have been updated',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update preferences',
        variant: 'destructive',
      });
    }
  });

  // Form submissions
  const onProfileSubmit = (data: z.infer<typeof profileSchema>) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: z.infer<typeof passwordSchema>) => {
    changePasswordMutation.mutate(data);
  };

  const onNotificationsSubmit = (data: z.infer<typeof notificationSchema>) => {
    updateNotificationsMutation.mutate(data);
  };

  // Theme form
  const themeForm = useForm<z.infer<typeof themeSchema>>({
    resolver: zodResolver(themeSchema),
    defaultValues: {
      primaryColor: 'hsl(173 74% 18%)',
      variant: 'tint', // Default to 'tint'
      appearance: 'light',
      radius: 0.5,
    },
  });

  // Load saved theme on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      const themeData = JSON.parse(savedTheme);
      themeForm.reset({
        primaryColor: themeData.primary || 'hsl(173 74% 18%)',
        variant: themeData.variant || 'tint', // Default to 'tint'
        appearance: themeData.appearance || 'light',
        radius: themeData.radius || 0.5,
      });
    }
  }, []);

  // Theme update mutation
  const updateThemeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof themeSchema>) => {
      // Envoyer les données au serveur pour mettre à jour theme.json
      return apiRequest('POST', '/api/user/theme', {
        primaryColor: data.primaryColor,
        variant: data.variant,
        appearance: data.appearance,
        radius: data.radius
      });
    },
    onSuccess: (_, variables) => {
      // Créer un objet avec les paramètres du thème
      const themeSettings = {
        primary: variables.primaryColor,
        variant: variables.variant,
        appearance: variables.appearance,
        radius: variables.radius
      };

      // Stocker les paramètres dans localStorage pour les réutiliser au chargement
      localStorage.setItem('theme', JSON.stringify(themeSettings));

      toast({
        title: 'Thème mis à jour',
        description: 'Vos préférences de thème ont été enregistrées. Rechargement de la page...',
      });

      // Appliquer les CSS variables au document root
      document.documentElement.style.setProperty('--primary', variables.primaryColor);

      // Rechargement de la page après délai pour permettre à l'utilisateur de voir le toast
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Échec de la mise à jour du thème',
        variant: 'destructive',
      });
    }
  });

  const onThemeSubmit = (data: z.infer<typeof themeSchema>) => {
    updateThemeMutation.mutate(data);
  };

  if (!user) {
    return (
      <div className="h-60 flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Paramètres</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left column - User info */}
        <div className="md:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="rounded-full p-[2px] bg-primary">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback style={{backgroundColor: 'var(--primary)', color: 'white'}} className="text-2xl font-medium">
                      {user?.firstName && user?.lastName ? `${user.firstName[0]}${user.lastName[0]}` : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-semibold">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Rôle: {user.role && user.role === 'medecin' ? 'Professionnel Médical' : user?.role?.charAt(0)?.toUpperCase() + user?.role?.slice(1) || ''}
                  </p>
                </div>
              </div>

              <Separator className="my-6" />

              <nav className="space-y-1">
                <Button
                  variant={selectedTab === 'profile' ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setSelectedTab('profile')}
                >
                  <User className="mr-2 h-4 w-4" />
                  Profil
                </Button>
                <Button
                  variant={selectedTab === 'password' ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setSelectedTab('password')}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Mot de passe
                </Button>
                
                <Button
                  variant={selectedTab === 'theme' ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setSelectedTab('theme')}
                >
                  <Palette className="mr-2 h-4 w-4" />
                  Thème
                </Button>
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Settings tabs */}
        <div className="md:col-span-3">
          <Card className="h-full">
            {selectedTab === 'profile' && (
              <>
                <CardHeader>
                  <CardTitle>Informations du Profil</CardTitle>
                  <CardDescription>
                    Mettez à jour vos informations personnelles et professionnelles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={profileForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Prénom</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={profileForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nom</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />


                      </div>

                      <CardFooter className="px-0 pt-4 pb-0">
                        <Button
                          type="submit"
                          className="ml-auto"
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? (
                            <>
                              <Loader size="sm" color="white" className="mr-2" />
                              Enregistrement...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Enregistrer les modifications
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </form>
                  </Form>
                </CardContent>
              </>
            )}

            {selectedTab === 'password' && (
              <>
                <CardHeader>
                  <CardTitle>Changer le mot de passe</CardTitle>
                  <CardDescription>
                    Mettez à jour le mot de passe de votre compte
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                      <div className="space-y-4">
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mot de passe actuel</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nouveau mot de passe</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormDescription>
                                Le mot de passe doit comporter au moins 6 caractères
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirmer le nouveau mot de passe</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <CardFooter className="px-0 pt-4 pb-0">
                        <Button
                          type="submit"
                          className="ml-auto"
                          disabled={changePasswordMutation.isPending}
                        >
                          {changePasswordMutation.isPending ? (
                            <>
                              <Loader size="sm" color="white" className="mr-2" />
                              Mise à jour...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Mettre à jour le mot de passe
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </form>
                  </Form>
                </CardContent>
              </>
            )}

            

            {selectedTab === 'theme' && (
              <>
                <CardHeader>
                  <CardTitle>Thème de l'application</CardTitle>
                  <CardDescription>
                    Personnalisez l'apparence de l'application
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...themeForm}>
                    <form onSubmit={themeForm.handleSubmit(onThemeSubmit)} className="space-y-6">
                      <div className="space-y-4">
                        <FormField
                          control={themeForm.control}
                          name="primaryColor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Couleur principale</FormLabel>
                              <div className="grid grid-cols-5 gap-3">
                                {[
                                  'hsl(173 74% 18%)',  // Vert émeraude
                                  'hsl(221 83% 53%)',  // Bleu royal
                                  'hsl(142 76% 36%)',  // Vert forêt
                                  'hsl(346 84% 61%)',  // Rose vif
                                  'hsl(270 67% 47%)',  // Violet profond
                                  'hsl(32 95% 44%)',   // Orange brûlé
                                  'hsl(193 82% 31%)',  // Bleu océan
                                  'hsl(322 81% 43%)',  // Magenta
                                  'hsl(155 72% 67%)',  // Menthe
                                  'hsl(45 93% 47%)',   // Jaune doré
                                  'hsl(215 50% 23%)',  // Bleu marine foncé
                                  'hsl(354 70% 25%)',  // Rouge bordeaux
                                  'hsl(291 47% 30%)',  // Violet prune
                                  'hsl(170 59% 19%)',  // Vert sapin
                                  'hsl(200 70% 17%)'   // Bleu nuit
                                ].map((color) => (
                                  <div 
                                    key={color} 
                                    className={`h-12 rounded-md border-2 cursor-pointer transition-all transform hover:scale-105 ${field.value === color ? 'ring-2 ring-offset-2 border-primary shadow-lg' : 'border-muted hover:border-primary/50'}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => field.onChange(color)}
                                  />
                                ))}
                              </div>
                              <FormDescription>
                                Choisissez une couleur principale pour l'application
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={themeForm.control}
                          name="variant"
                          render={({ field }) => (
                            <FormField
                              control={themeForm.control}
                              name="variant"
                              defaultValue="tint"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Variante de couleur</FormLabel>
                                  <FormControl>
                                    <Input type="hidden" value="tint" {...field} />
                                  </FormControl>
                                  <FormDescription>
                                    Teinte par défaut
                                  </FormDescription>
                                </FormItem>
                              )}
                            />
                          )}
                        />

                        <FormField
                          control={themeForm.control}
                          name="appearance"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Apparence</FormLabel>
                              <FormControl>
                                <input type="hidden" value="light" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={themeForm.control}
                          name="radius"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rayon de bordure: {field.value}</FormLabel>
                              <FormControl>
                                <input
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.1"
                                  value={field.value}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                  className="w-full"
                                />
                              </FormControl>
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Carré</span>
                                <span>Rond</span>
                              </div>
                              <FormDescription>
                                Ajustez l'arrondi des éléments de l'interface utilisateur
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Theme Preview */}
                        <div className="bg-muted p-4 rounded-md mt-6">
                          <h3 className="text-md font-medium mb-2">Aperçu du thème</h3>
                          <div className="flex gap-2 flex-wrap">
                            <Button 
                              size="sm" 
                              style={{
                                backgroundColor: themeForm.watch('primaryColor'),
                                borderRadius: `${themeForm.watch('radius') * 0.5}rem`
                              }}
                            >
                              Bouton principal
                            </Button>
                            <Button 
                              size="sm" 
                              variant="secondary"
                              style={{
                                borderRadius: `${themeForm.watch('radius') * 0.5}rem`
                              }}
                            >
                              Bouton secondaire
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              style={{
                                borderRadius: `${themeForm.watch('radius') * 0.5}rem`
                              }}
                            >
                              Bouton destructeur
                            </Button>
                          </div>
                        </div>
                      </div>

                      <CardFooter className="px-0 pt-4 pb-0">
                        <Button
                          type="submit"
                          className="ml-auto"
                          disabled={updateThemeMutation.isPending}
                          style={{
                            backgroundColor: themeForm.watch('primaryColor'),
                            color: 'white',
                            borderRadius: `${themeForm.watch('radius') * 0.5}rem`
                          }}
                        >
                          {updateThemeMutation.isPending ? (
                            <>
                              <Loader size="sm" color="white" className="mr-2" />
                              Application du thème...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Appliquer le thème
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </form>
                  </Form>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}