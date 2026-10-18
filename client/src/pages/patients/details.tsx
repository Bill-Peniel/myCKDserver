import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Droplets,
  FlaskConical,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  UserX,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { Patient, PatientLabResult, Appointment } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState, StageBadge, StatCard, StatusBadge, UserAvatar } from '@/components/kit';
import { calculateAge, cn, formatDate, formatShortDate, formatTime } from '@/lib/utils';
import { GenerateReport } from '@/components/patient-report/generate-report';

interface PatientDetailsProps {
  id: string;
}

const GENDER_LABELS: Record<string, string> = { M: 'Homme', F: 'Femme', Autre: 'Autre' };

const pill = 'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap';

/** Interprétation d'un résultat par rapport à la plage normale */
function ResultStatus({ result }: { result: any }) {
  const value = parseFloat(String(result.resultValue));
  const min = result.labTest?.normalMin;
  const max = result.labTest?.normalMax;

  if (min != null && max != null) {
    const normalValue = (max + min) / 2;
    const deviation = Math.abs((value - normalValue) / normalValue);

    if (value < min || value > max) {
      const low = value < min;
      const severe = deviation > 0.3;
      const label = severe
        ? low ? 'Très bas' : 'Très élevé'
        : low ? 'Bas' : 'Élevé';
      return (
        <span
          className={cn(
            pill,
            severe
              ? 'bg-destructive/10 text-destructive border-destructive/25'
              : 'bg-warning/10 text-warning border-warning/25',
          )}
          title={severe ? (low ? 'Dangereusement bas' : 'Dangereusement élevé') : low ? 'En dessous de la normale' : 'Au-dessus de la normale'}
        >
          {low ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
          {label}
        </span>
      );
    }
    return (
      <span className={cn(pill, 'bg-success/10 text-success border-success/25')}>
        <span className="h-1.5 w-1.5 rounded-full bg-success" />
        Normal
      </span>
    );
  }
  return (
    <span className={cn(pill, 'bg-muted text-muted-foreground')}>
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
      Non défini
    </span>
  );
}

function isAbnormal(result: any) {
  const v = Number(result.resultValue);
  const min = result.labTest?.normalMin;
  const max = result.labTest?.normalMax;
  return (min != null && v < min) || (max != null && v > max);
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground [&_svg]:h-3.5 [&_svg]:w-3.5">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 break-words text-sm font-medium text-foreground">{children}</dd>
      </div>
    </div>
  );
}

function PatientDfgChart({ points }: { points: { date: string; value: number }[] }) {
  const last = points.at(-1)?.value;
  const first = points[0]?.value;
  const delta = last != null && first != null ? last - first : null;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle>Évolution du DFG</CardTitle>
          <CardDescription>Débit de filtration glomérulaire estimé (mL/min/1.73m²)</CardDescription>
        </div>
        {delta != null && points.length > 1 && (
          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium',
              delta >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive',
            )}
          >
            {delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span className="tabular">{delta > 0 ? '+' : ''}{delta}</span> depuis le {formatShortDate(points[0].date)}
          </span>
        )}
      </CardHeader>
      <CardContent>
        {points.length === 0 ? (
          <EmptyState
            compact
            icon={<Activity />}
            title="Aucun DFG enregistré"
            description="Saisissez une créatinine sanguine : le DFG est calculé automatiquement."
          />
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="patientDfgFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={24}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  tickFormatter={(d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={44}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  domain={[0, (max: number) => Math.max(100, Math.ceil(max / 10) * 10)]}
                />
                <ReferenceLine
                  y={60}
                  stroke="hsl(var(--warning))"
                  strokeDasharray="4 4"
                  strokeOpacity={0.7}
                  label={{ value: 'Seuil 60', position: 'insideTopRight', fill: 'hsl(var(--warning))', fontSize: 10 }}
                />
                <ReferenceLine
                  y={15}
                  stroke="hsl(var(--destructive))"
                  strokeDasharray="4 4"
                  strokeOpacity={0.6}
                  label={{ value: 'Seuil 15', position: 'insideTopRight', fill: 'hsl(var(--destructive))', fontSize: 10 }}
                />
                <Tooltip
                  cursor={{ stroke: 'hsl(var(--border))' }}
                  content={({ active, payload }) =>
                    active && payload?.[0] ? (
                      <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-float">
                        <p className="text-muted-foreground">{formatShortDate(payload[0].payload.date)}</p>
                        <p className="tabular mt-0.5 font-medium">{payload[0].value} mL/min</p>
                      </div>
                    ) : null
                  }
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#patientDfgFill)"
                  dot={{ r: 3, fill: 'hsl(var(--background))', stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DetailsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-28" />
      <Skeleton className="h-[136px] rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[138px] rounded-xl" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}

export default function PatientDetails({ id }: PatientDetailsProps) {
  const [, setLocation] = useLocation();
  const [showAllResults, setShowAllResults] = useState(false);

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
    select: (data) => data.filter((apt: any) => apt.patient._id === id)
  });

  // Données dérivées pour l'affichage uniquement
  const results = labResults as any[];
  const sortedResults = useMemo(
    () => [...results].sort((a, b) => new Date(b.resultDate).getTime() - new Date(a.resultDate).getTime()),
    [results],
  );
  const dfgPoints = useMemo(
    () =>
      results
        .filter((r) => r.labTest?.testName?.toLowerCase().includes('dfg'))
        .map((r) => ({ date: String(r.resultDate).slice(0, 10), value: Number(r.resultValue) }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [results],
  );
  const lastCreat = sortedResults.find((r) => r.labTest?.testName?.toLowerCase().includes('créatinine sanguine'))
    ?? sortedResults.find((r) => r.labTest?.testName?.toLowerCase().includes('créatinine'));
  const abnormalCount = sortedResults.filter(isAbnormal).length;
  const RESULTS_PREVIEW = 8;
  const visibleResults = showAllResults ? sortedResults : sortedResults.slice(0, RESULTS_PREVIEW);
  const sortedAppointments = [...(appointments as any[])].sort(
    (a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime(),
  );
  const nextAppointment = sortedAppointments.find(
    (a) => new Date(a.appointmentDate).getTime() >= Date.now() && a.doctorStatus !== 'cancelled',
  );

  if (patientLoading || resultsLoading || appointmentsLoading) {
    return <DetailsSkeleton />;
  }

  if (!patient) {
    return (
      <Card>
        <EmptyState
          icon={<UserX />}
          title="Patient introuvable"
          description="Ce dossier n'existe pas ou a été supprimé."
          action={
            <Button variant="outline" onClick={() => setLocation('/patients')}>
              <ArrowLeft /> Retour aux patients
            </Button>
          }
        />
      </Card>
    );
  }

  const p = patient as any;
  const code = `P-${String(p._id ?? p.id).padStart(5, '0')}`;
  const lastDfg = dfgPoints.at(-1);
  const prevDfg = dfgPoints.at(-2);
  const dfgDelta = lastDfg && prevDfg ? lastDfg.value - prevDfg.value : null;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" onClick={() => setLocation('/patients')}>
        <ArrowLeft /> Patients
      </Button>

      {/* En-tête du dossier */}
      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-gradient-to-br from-primary/15 to-transparent blur-3xl" />
        <div className="relative flex flex-col gap-5 p-5 sm:p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <UserAvatar firstName={patient.user.firstName} lastName={patient.user.lastName} size="xl" />
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground sm:text-[26px]">
                  {patient.user.firstName} {patient.user.lastName}
                </h1>
                <StageBadge stage={patient.ckdStage} />
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="tabular rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs">{code}</span>
                <span className="tabular">{calculateAge(patient.birthDate)} ans</span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span>{GENDER_LABELS[patient.gender] ?? patient.gender}</span>
                {p.createdAt && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <span>Suivi depuis le {formatShortDate(p.createdAt)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <Link href={`/patients/add-edit/${id}`}>
                <Pencil /> Modifier
              </Link>
            </Button>
            <GenerateReport patient={patient} />
          </div>
        </div>
      </Card>

      {/* Indicateurs clés */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Dernier DFG estimé"
          value={lastDfg ? <>{lastDfg.value} <span className="text-sm font-normal text-muted-foreground">mL/min</span></> : '—'}
          icon={<Activity />}
          tone={!lastDfg ? 'primary' : lastDfg.value < 15 ? 'destructive' : lastDfg.value < 60 ? 'warning' : 'success'}
          hint={
            lastDfg
              ? dfgDelta != null
                ? `${dfgDelta > 0 ? '+' : ''}${dfgDelta} vs mesure précédente · ${formatShortDate(lastDfg.date)}`
                : `Mesuré le ${formatShortDate(lastDfg.date)}`
              : 'Aucune mesure'
          }
        />
        <StatCard
          label="Créatinine sanguine"
          value={lastCreat ? <>{lastCreat.resultValue} <span className="text-sm font-normal text-muted-foreground">{lastCreat.labTest?.unit}</span></> : '—'}
          icon={<Droplets />}
          tone="info"
          hint={lastCreat ? `Mesurée le ${formatShortDate(lastCreat.resultDate)}` : 'Aucune mesure'}
        />
        <StatCard
          label="Résultats de labo"
          value={sortedResults.length}
          icon={<FlaskConical />}
          tone="violet"
          hint={abnormalCount > 0 ? `${abnormalCount} hors de la plage normale` : 'Tous dans la normale'}
        />
        <StatCard
          label="Prochain rendez-vous"
          value={nextAppointment ? formatShortDate(nextAppointment.appointmentDate) : '—'}
          icon={<CalendarDays />}
          tone="primary"
          hint={nextAppointment ? `${formatTime(nextAppointment.appointmentDate)} · ${nextAppointment.purpose || 'Consultation'}` : 'Aucun rendez-vous planifié'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Colonne principale */}
        <div className="space-y-4 lg:col-span-2">
          <PatientDfgChart points={dfgPoints} />

          <Card className="overflow-hidden">
            <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
              <div className="space-y-1">
                <CardTitle>Résultats de laboratoire</CardTitle>
                <CardDescription>
                  {sortedResults.length} analyse{sortedResults.length > 1 ? 's' : ''} enregistrée{sortedResults.length > 1 ? 's' : ''}
                </CardDescription>
              </div>
            </CardHeader>
            {sortedResults.length === 0 ? (
              <CardContent>
                <EmptyState
                  compact
                  icon={<FlaskConical />}
                  title="Aucun résultat"
                  description="Les analyses de ce patient apparaîtront ici."
                />
              </CardContent>
            ) : (
              <>
                <div className="hidden overflow-x-auto border-t sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="pl-5">Analyse</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Résultat</TableHead>
                        <TableHead>Plage normale</TableHead>
                        <TableHead className="pr-5">Interprétation</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleResults.map((result) => (
                        <TableRow key={result._id} className="hover:bg-muted/50">
                          <TableCell className="pl-5">
                            <p className="font-medium text-foreground">{result.labTest?.testName}</p>
                            {result.comment && <p className="text-xs text-muted-foreground">{result.comment}</p>}
                          </TableCell>
                          <TableCell className="tabular whitespace-nowrap text-muted-foreground">
                            {formatShortDate(result.resultDate)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right">
                            <span className="tabular font-semibold text-foreground">{result.resultValue}</span>{' '}
                            <span className="text-xs text-muted-foreground">{result.labTest?.unit}</span>
                          </TableCell>
                          <TableCell className="tabular whitespace-nowrap text-xs text-muted-foreground">
                            {result.labTest?.normalMin != null && result.labTest?.normalMax != null
                              ? `${result.labTest.normalMin} – ${result.labTest.normalMax}`
                              : '—'}
                          </TableCell>
                          <TableCell className="pr-5">
                            <ResultStatus result={result} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <ul className="divide-y border-t sm:hidden">
                  {visibleResults.map((result) => (
                    <li key={result._id} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-foreground">{result.labTest?.testName}</p>
                        <p className="text-xs text-muted-foreground">{formatShortDate(result.resultDate)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="tabular text-[13px] font-semibold">
                          {result.resultValue} <span className="text-xs font-normal text-muted-foreground">{result.labTest?.unit}</span>
                        </span>
                        <ResultStatus result={result} />
                      </div>
                    </li>
                  ))}
                </ul>
                {sortedResults.length > RESULTS_PREVIEW && (
                  <div className="border-t px-5 py-2.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-muted-foreground"
                      onClick={() => setShowAllResults((v) => !v)}
                    >
                      {showAllResults
                        ? 'Afficher moins'
                        : `Afficher les ${sortedResults.length - RESULTS_PREVIEW} autres résultats`}
                      <ChevronDown className={cn('transition-transform', showAllResults && 'rotate-180')} />
                    </Button>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y">
                <InfoRow icon={<Mail />} label="Email">{patient.user.email}</InfoRow>
                <InfoRow icon={<Phone />} label="Téléphone">
                  <span className="tabular">{patient.phone || 'Non renseigné'}</span>
                </InfoRow>
                <InfoRow icon={<CalendarDays />} label="Date de naissance">
                  {formatDate(patient.birthDate)}
                </InfoRow>
                <InfoRow icon={<MapPin />} label="Adresse">{patient.address || 'Non renseignée'}</InfoRow>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Suivi médical</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
                <UserAvatar firstName={p.doctor?.user?.firstName} lastName={p.doctor?.user?.lastName} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    Dr. {p.doctor?.user?.firstName} {p.doctor?.user?.lastName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[p.doctor?.specialty, p.doctor?.hospital].filter(Boolean).join(' · ') || 'Médecin traitant'}
                  </p>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs text-muted-foreground">Stade MRC</dt>
                  <dd className="mt-1"><StageBadge stage={patient.ckdStage} /></dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Dossier créé le</dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">{p.createdAt ? formatShortDate(p.createdAt) : '—'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-start justify-between gap-2 space-y-0 pb-3">
              <div className="space-y-1">
                <CardTitle>Rendez-vous</CardTitle>
                <CardDescription>Consultations de ce patient</CardDescription>
              </div>
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-2 pb-2">
              {sortedAppointments.length === 0 ? (
                <EmptyState
                  compact
                  icon={<CalendarDays />}
                  title="Aucun rendez-vous"
                  description="Aucune consultation n'est programmée."
                />
              ) : (
                <ul className="space-y-0.5">
                  {sortedAppointments.map((a) => {
                    const d = new Date(a.appointmentDate);
                    const past = d.getTime() < Date.now();
                    return (
                      <li
                        key={a._id}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/60',
                          past && 'opacity-70',
                        )}
                      >
                        <div className="flex w-11 shrink-0 flex-col items-center rounded-lg border bg-background py-1 shadow-xs">
                          <span className="text-[10px] font-medium uppercase text-primary">
                            {d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}
                          </span>
                          <span className="tabular text-base font-semibold leading-none">{d.getDate()}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium">{a.purpose || 'Consultation'}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {d.toLocaleDateString('fr-FR', { weekday: 'long' })} · {formatTime(a.appointmentDate)}
                          </p>
                        </div>
                        <StatusBadge status={a.doctorStatus} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
