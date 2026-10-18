import { useState, useEffect, type CSSProperties, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import {
  Bell,
  Check,
  KeyRound,
  Loader2,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  Save,
  ShieldCheck,
  Sun,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader, UserAvatar } from '@/components/kit';
import { useTheme, THEME_ACCENTS, type ThemeMode } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';

const profileSchema = z.object({
  firstName: z.string().min(2, { message: 'Le prénom doit comporter au moins 2 caractères' }),
  lastName: z.string().min(2, { message: 'Le nom doit comporter au moins 2 caractères' }),
  email: z.string().email({ message: 'Veuillez saisir une adresse e-mail valide' }),
  specialty: z.string().optional(),
  hospital: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Le mot de passe actuel est requis' }),
  newPassword: z.string().min(6, { message: 'Le nouveau mot de passe doit comporter au moins 6 caractères' }),
  confirmPassword: z.string().min(6, { message: 'La confirmation doit comporter au moins 6 caractères' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

const notificationSchema = z.object({
  emailNotifications: z.boolean(),
  criticalAlertsOnly: z.boolean(),
  appointmentReminders: z.boolean(),
  labResultAlerts: z.boolean(),
});

type TabId = 'profile' | 'security' | 'notifications' | 'appearance';

const TABS: { id: TabId; label: string; description: string; icon: typeof User }[] = [
  { id: 'profile', label: 'Profil', description: 'Identité et exercice', icon: User },
  { id: 'security', label: 'Sécurité', description: 'Mot de passe', icon: ShieldCheck },
  { id: 'notifications', label: 'Notifications', description: 'Alertes et rappels', icon: Bell },
  { id: 'appearance', label: 'Apparence', description: 'Thème et couleurs', icon: Palette },
];

const labelCls = 'text-[13px] font-medium';

/* ------------------------------------------------------------------ */
/*  Blocs de mise en page                                              */
/* ------------------------------------------------------------------ */

function SettingsSection({ title, description, children, footer }: { title: string; description: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
      {footer && (
        <div className="flex flex-col-reverse items-stretch gap-2 border-t bg-muted/40 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          {footer}
        </div>
      )}
    </Card>
  );
}

function SubmitButton({ pending, children, pendingLabel }: { pending: boolean; children: ReactNode; pendingLabel: string }) {
  return (
    <Button type="submit" disabled={pending} className="sm:ml-auto">
      {pending ? <Loader2 className="animate-spin" /> : <Save />}
      {pending ? pendingLabel : children}
    </Button>
  );
}

/* ------------------------------------------------------------------ */
/*  Apparence : aperçus miniatures                                     */
/* ------------------------------------------------------------------ */

// Les aperçus montrent un thème précis quel que soit le mode actif :
// le mode sombre réutilise la classe `.dark`, le mode clair réapplique localement les tokens de `:root`.
const LIGHT_TOKENS = {
  '--background': '0 0% 100%',
  '--card': '0 0% 100%',
  '--foreground': '240 10% 3.9%',
  '--muted': '240 4.8% 95.9%',
  '--muted-foreground': '240 3.8% 46.1%',
  '--border': '240 5.9% 90%',
  '--surface': '240 5% 98.4%',
} as CSSProperties;

function MiniWindow({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div className={cn('flex h-full w-full gap-1.5 bg-surface p-2', className)} style={style}>
      <div className="flex w-1/4 flex-col gap-1 rounded-[5px] border bg-background p-1.5">
        <div className="h-1.5 w-3/4 rounded-full bg-primary" />
        <div className="h-1 w-full rounded-full bg-muted" />
        <div className="h-1 w-5/6 rounded-full bg-muted" />
        <div className="h-1 w-2/3 rounded-full bg-muted" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="h-2 w-1/2 rounded-full bg-foreground/80" />
        <div className="grid grid-cols-2 gap-1.5">
          <div className="h-6 rounded-[5px] border bg-card p-1">
            <div className="h-1 w-1/2 rounded-full bg-muted-foreground/40" />
          </div>
          <div className="h-6 rounded-[5px] border bg-card p-1">
            <div className="h-1 w-1/3 rounded-full bg-primary/70" />
          </div>
        </div>
        <div className="flex-1 rounded-[5px] border bg-card p-1">
          <div className="h-1 w-2/3 rounded-full bg-muted" />
          <div className="mt-1 h-1 w-1/2 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}

function ModePreview({ mode }: { mode: ThemeMode }) {
  if (mode === 'light') return <MiniWindow style={LIGHT_TOKENS} />;
  if (mode === 'dark') return <MiniWindow className="dark" />;
  return (
    <div className="relative h-full w-full">
      <MiniWindow style={LIGHT_TOKENS} />
      <div className="dark absolute inset-0 [clip-path:polygon(55%_0,100%_0,100%_100%,45%_100%)]">
        <MiniWindow />
      </div>
    </div>
  );
}

const MODES: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Clair', icon: Sun },
  { value: 'dark', label: 'Sombre', icon: Moon },
  { value: 'system', label: 'Système', icon: Monitor },
];

function AppearanceSettings() {
  const { mode, setMode, accent, setAccent, radius, setRadius, resolvedMode } = useTheme();
  const accentLabel = THEME_ACCENTS.find((a) => a.value === accent)?.label;

  return (
    <div className="space-y-6">
      <SettingsSection title="Mode d'affichage" description="Choisissez l'apparence de l'interface. « Système » suit le réglage de votre appareil.">
        <div role="radiogroup" aria-label="Mode d'affichage" className="grid grid-cols-3 gap-3 sm:gap-4">
          {MODES.map(({ value, label, icon: Icon }) => {
            const active = mode === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setMode(value)}
                className="group text-left focus-visible:outline-none"
              >
                <div
                  className={cn(
                    'relative aspect-[16/10] overflow-hidden rounded-lg border transition-all',
                    active
                      ? 'border-primary ring-2 ring-primary/25'
                      : 'group-hover:border-foreground/20 group-focus-visible:ring-2 group-focus-visible:ring-ring',
                  )}
                >
                  <ModePreview mode={value} />
                  {active && (
                    <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <Icon className={cn('h-3.5 w-3.5', active ? 'text-primary' : 'text-muted-foreground')} />
                  <span className={cn('text-[13px]', active ? 'font-medium text-foreground' : 'text-muted-foreground')}>{label}</span>
                </div>
              </button>
            );
          })}
        </div>
        {mode === 'system' && (
          <p className="text-xs text-muted-foreground">
            Actuellement : mode {resolvedMode === 'dark' ? 'sombre' : 'clair'} (préférence de l'appareil).
          </p>
        )}
      </SettingsSection>

      <SettingsSection title="Couleur d'accent" description="Teinte utilisée pour les boutons, liens, sélections et indicateurs.">
        <div role="radiogroup" aria-label="Couleur d'accent" className="flex flex-wrap items-center gap-3">
          {THEME_ACCENTS.map((a) => {
            const active = accent === a.value;
            return (
              <button
                key={a.value}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={a.label}
                title={a.label}
                onClick={() => setAccent(a.value)}
                className={cn(
                  'relative flex h-9 w-9 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  'after:absolute after:inset-0 after:rounded-full after:ring-1 after:ring-inset after:ring-foreground/15',
                  active && 'ring-2 ring-foreground/70',
                )}
                style={{ backgroundColor: a.swatch }}
              >
                {active && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-background text-foreground shadow-sm">
                    <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                  </span>
                )}
              </button>
            );
          })}
          <span className="ml-1 text-[13px] text-muted-foreground">{accentLabel}</span>
        </div>
      </SettingsSection>

      <SettingsSection title="Arrondi des angles" description="Ajustez le rayon des cartes, boutons et champs de l'interface.">
        <div className="grid gap-6 xl:grid-cols-[1fr_280px] xl:items-center">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={labelCls}>Rayon</span>
              <span className="tabular rounded-md border bg-muted/50 px-2 py-0.5 text-xs font-medium">
                {radius.toFixed(2).replace('.', ',')} rem
              </span>
            </div>
            <Slider
              min={0}
              max={1.25}
              step={0.05}
              value={[radius]}
              onValueChange={([v]) => setRadius(Number(v.toFixed(2)))}
              aria-label="Rayon des angles"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Carré</span>
              <span>Arrondi</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[0, 0.5, 0.75, 1].map((r) => (
                <Button
                  key={r}
                  type="button"
                  size="sm"
                  variant={Math.abs(radius - r) < 0.001 ? 'soft' : 'outline'}
                  onClick={() => setRadius(r)}
                  className="tabular"
                >
                  {r === 0.75 ? 'Par défaut' : `${String(r).replace('.', ',')} rem`}
                </Button>
              ))}
            </div>
          </div>

          {/* Aperçu live : reprend --radius appliqué au document */}
          <div className="rounded-xl border bg-surface p-4">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Aperçu</p>
            <div className="space-y-3 rounded-lg border bg-card p-3 shadow-card">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
                  <Palette className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">CKD Care</p>
                  <p className="truncate text-[11px] text-muted-foreground">Accent {accentLabel?.toLowerCase()}</p>
                </div>
                <Badge variant="soft">Nouveau</Badge>
              </div>
              <Input placeholder="Champ de saisie" className="h-8 text-xs" readOnly />
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" type="button">Principal</Button>
                <Button size="sm" variant="outline" className="flex-1" type="button">Secondaire</Button>
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>

      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => {
            setMode('light');
            setAccent('teal');
            setRadius(0.75);
          }}
        >
          <RotateCcw /> Rétablir les réglages par défaut
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

const NOTIFICATION_ITEMS: { name: keyof z.infer<typeof notificationSchema>; label: string; description: string }[] = [
  { name: 'emailNotifications', label: 'Notifications par e-mail', description: 'Recevoir un e-mail pour les nouvelles alertes.' },
  { name: 'criticalAlertsOnly', label: 'Alertes critiques uniquement', description: 'Ne notifier que les situations nécessitant une action urgente.' },
  { name: 'appointmentReminders', label: 'Rappels de rendez-vous', description: 'Recevoir un rappel avant chaque consultation planifiée.' },
  { name: 'labResultAlerts', label: 'Résultats de laboratoire', description: 'Être averti lorsqu\'un résultat hors norme est saisi.' },
];

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, setAuthState, logout } = useAuth();
  const [selectedTab, setSelectedTab] = useState<TabId>('profile');

  // Get doctor details
  const { data: doctorDetails } = useQuery({
    queryKey: ['doctor', user?.id],
    queryFn: () => apiRequest('GET', `/api/doctors/user/${user?.id}`).then(res => res.json()),
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

  // Préférences enregistrées côté serveur
  const { data: savedPreferences } = useQuery<z.infer<typeof notificationSchema>>({
    queryKey: ['/api/user/notification-preferences'],
    enabled: !!user,
  });

  useEffect(() => {
    if (savedPreferences) notificationForm.reset(savedPreferences);
  }, [savedPreferences]);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileSchema>) => {
      const response = await apiRequest('PUT', '/api/user/profile', data);
      return response;
    },
    onSuccess: async (_response, data) => {
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
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de mettre à jour le profil',
        variant: 'destructive',
      });
    }
  });

  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof passwordSchema>) => {
      return apiRequest('POST', '/api/user/change-password', data);
    },
    onSuccess: () => {
      toast({
        title: 'Mot de passe modifié',
        description: 'Votre mot de passe a été modifié avec succès',
      });
      passwordForm.reset({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de modifier le mot de passe',
        variant: 'destructive',
      });
    }
  });

  // Notification preferences mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof notificationSchema>) => {
      return apiRequest('POST', '/api/user/notification-preferences', data);
    },
    onSuccess: () => {
      toast({
        title: 'Préférences enregistrées',
        description: 'Vos préférences de notification ont été mises à jour',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de mettre à jour les préférences',
        variant: 'destructive',
      });
    }
  });

  // Form submissions
  const onProfileSubmit = (data: z.infer<typeof profileSchema>) => {
    // Évite d'écraser spécialité / établissement avant le chargement du profil médecin
    if (user?.role === 'medecin' && !doctorDetails) return;
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: z.infer<typeof passwordSchema>) => {
    changePasswordMutation.mutate(data);
  };

  const onNotificationsSubmit = (data: z.infer<typeof notificationSchema>) => {
    updateNotificationsMutation.mutate(data);
  };

  if (!user) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-14 w-72" />
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  const isDoctor = user.role === 'medecin';
  const roleLabel = isDoctor ? 'Professionnel médical' : user.role === 'admin' ? 'Administrateur' : user.role ?? '';

  return (
    <div className="space-y-6">
      <PageHeader title="Paramètres" description="Gérez votre compte, votre sécurité et vos préférences d'affichage." />

      <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:gap-10">
        {/* Navigation verticale (horizontale défilante sur mobile) */}
        <nav aria-label="Sections des paramètres" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
          <ul className="flex gap-1 border-b pb-px lg:sticky lg:top-6 lg:flex-col lg:border-b-0 lg:pb-0">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = selectedTab === id;
              return (
                <li key={id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedTab(id)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative flex w-full items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      active
                        ? 'text-foreground lg:bg-muted'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                    )}
                  >
                    <Icon className={cn('h-4 w-4', active && 'text-primary')} />
                    {label}
                    {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary lg:hidden" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0 space-y-6">
          {selectedTab === 'profile' && (
            <>
              <Card className="relative overflow-hidden">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent" />
                <CardContent className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                  <UserAvatar firstName={user.firstName} lastName={user.lastName} size="xl" className="ring-4 ring-card" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-semibold tracking-tight">
                      {isDoctor ? 'Dr. ' : ''}{user.firstName} {user.lastName}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <Badge variant="soft" className="self-start sm:self-center">{roleLabel}</Badge>
                </CardContent>
              </Card>

              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                  <SettingsSection
                    title="Informations du profil"
                    description="Mettez à jour vos informations personnelles et professionnelles."
                    footer={
                      <>
                        <p className="text-xs text-muted-foreground">Vous serez déconnecté après l'enregistrement.</p>
                        <SubmitButton pending={updateProfileMutation.isPending} pendingLabel="Enregistrement…">
                          Enregistrer les modifications
                        </SubmitButton>
                      </>
                    }
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={profileForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={labelCls}>Prénom</FormLabel>
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
                            <FormLabel className={labelCls}>Nom</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-2">
                            <FormLabel className={labelCls}>Adresse e-mail</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {isDoctor && (
                        <>
                          <FormField
                            control={profileForm.control}
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
                            control={profileForm.control}
                            name="hospital"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className={labelCls}>Hôpital</FormLabel>
                                <FormControl>
                                  <Input placeholder="Établissement d'exercice" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                    </div>
                  </SettingsSection>
                </form>
              </Form>
            </>
          )}

          {selectedTab === 'security' && (
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
                <SettingsSection
                  title="Changer le mot de passe"
                  description="Utilisez un mot de passe unique d'au moins 6 caractères."
                  footer={
                    <>
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <KeyRound className="h-3.5 w-3.5" /> Le mot de passe actuel est requis.
                      </p>
                      <SubmitButton pending={changePasswordMutation.isPending} pendingLabel="Mise à jour…">
                        Mettre à jour le mot de passe
                      </SubmitButton>
                    </>
                  }
                >
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem className="sm:max-w-sm">
                        <FormLabel className={labelCls}>Mot de passe actuel</FormLabel>
                        <FormControl>
                          <Input type="password" autoComplete="current-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="h-px bg-border" />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelCls}>Nouveau mot de passe</FormLabel>
                          <FormControl>
                            <Input type="password" autoComplete="new-password" {...field} />
                          </FormControl>
                          <FormDescription className="text-xs">Au moins 6 caractères.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelCls}>Confirmer le mot de passe</FormLabel>
                          <FormControl>
                            <Input type="password" autoComplete="new-password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </SettingsSection>
              </form>
            </Form>
          )}

          {selectedTab === 'notifications' && (
            <Form {...notificationForm}>
              <form onSubmit={notificationForm.handleSubmit(onNotificationsSubmit)}>
                <SettingsSection
                  title="Préférences de notification"
                  description="Choisissez les événements pour lesquels vous souhaitez être averti."
                  footer={
                    <SubmitButton pending={updateNotificationsMutation.isPending} pendingLabel="Enregistrement…">
                      Enregistrer les préférences
                    </SubmitButton>
                  }
                >
                  <div className="-mx-5 -mb-5 -mt-1 divide-y border-t">
                    {NOTIFICATION_ITEMS.map((item) => (
                      <FormField
                        key={item.name}
                        control={notificationForm.control}
                        name={item.name}
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between gap-4 space-y-0 px-5 py-4 transition-colors hover:bg-muted/40">
                            <div className="space-y-0.5">
                              <FormLabel className="cursor-pointer text-sm font-medium">{item.label}</FormLabel>
                              <FormDescription className="text-xs">{item.description}</FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="data-[state=checked]:bg-primary"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </SettingsSection>
              </form>
            </Form>
          )}

          {selectedTab === 'appearance' && <AppearanceSettings />}
        </div>
      </div>
    </div>
  );
}
