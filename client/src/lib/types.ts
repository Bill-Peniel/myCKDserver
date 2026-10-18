// Types partagés du frontend, alignés sur les réponses de l'API (server/serializers.ts).
// Chaque entité expose `id` (numérique) et `_id` (même valeur en chaîne, héritée de l'ancienne API MongoDB).

export type CkdStage = 'Stage 1' | 'Stage 2' | 'Stage 3A' | 'Stage 3B' | 'Stage 4' | 'Stage 5';
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type NotificationSeverity = 'info' | 'warning' | 'error' | 'dfg';

// Auth types
export interface AuthUser {
  id: number;
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'patient' | 'medecin' | 'admin';
  createdAt: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  userDetails?: any;
}

/** Utilisateur public imbriqué dans un médecin ou un patient */
export interface PublicUser {
  id: number;
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt?: string;
}

// Dashboard types
export interface DashboardStats {
  totalPatients: number;
  totalAppointments: number;
  upcomingAppointments: number;
  criticalAlerts: number;
  pendingLabResults: number;
  stageDistribution: Record<CkdStage, number>;
  egfrTrend: {
    month: string;
    value: number;
  }[];
}

export interface Doctor {
  id: number;
  _id: string;
  userId: number;
  user: PublicUser;
  specialty: string | null;
  hospital?: string | null;
  createdAt?: string;
}

export interface Patient {
  id: number;
  _id: string;
  userId: number;
  doctorId: number | null;
  user: PublicUser;
  doctor?: Doctor | null;
  birthDate: string;
  gender: 'M' | 'F' | 'Autre';
  address?: string | null;
  phone?: string | null;
  ckdStage: CkdStage;
  proteinuriaLevel?: 'A1' | 'A2' | 'A3' | null;
  createdAt?: string;
  age?: number;
  latestEGFR?: number | null;
  lastVisit?: string | null;
  // Champs saisis dans certains formulaires (non persistés par l'API)
  lastEgfrValue?: number | null;
  lastProteinuriaValue?: number | null;
}

export interface Appointment {
  id: number;
  _id: string;
  patientId: number;
  doctorId: number;
  appointmentDate: string;
  purpose?: string | null;
  doctorStatus: AppointmentStatus;
  patientStatus: AppointmentStatus;
  /** Alias de doctorStatus */
  status: AppointmentStatus;
  patient?: Patient | null;
  doctor?: Doctor | null;
  createdAt?: string;
}

export interface Alert {
  id: number;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  patientId: number;
  patientInitials: string;
  time: string;
}

export interface LabTest {
  id: number;
  _id: string;
  testName: string;
  description?: string | null;
  unit?: string | null;
  normalMin?: number | null;
  normalMax?: number | null;
  category?: string | null;
}

export interface PatientLabResult {
  id: number;
  _id: string;
  patientId: number;
  doctorId: number | null;
  labTestId: number;
  resultValue: number;
  resultDate: string;
  createdAt?: string;
  labTest: LabTest;
  /** Patient complet, ou son identifiant si non chargé */
  patient?: Patient | string;
  doctor?: Doctor | null;
}

export interface Notification {
  id: number;
  _id: string;
  message: string;
  severity: NotificationSeverity;
  isRead: boolean;
  createdAt: string;
  /** Patient concerné (objet chargé), ou null */
  patientId: { id: number; _id: string; user: PublicUser } | null;
  doctorId: string;
  labTest: string | null;
  labResultId?: number | null;
}

export interface WorkflowRequirement {
  id: number;
  _id: string;
  testName: string;
  frequency: string;
  alert: { type: 'Inférieur à' | 'Supérieur à'; value: string; unit: string };
  action: 'Notification' | 'Email';
}

export interface Workflow {
  id: number;
  _id: string;
  name: string;
  description?: string | null;
  ckdStage?: CkdStage | null;
  createdBy: string;
  createdAt: string;
  requirements: WorkflowRequirement[];
}

// Form types for creating/editing
export interface PatientFormData {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  birthDate: string;
  gender: 'M' | 'F' | 'Autre';
  address?: string;
  phone?: string;
  ckdStage: string;
  proteinuriaLevel?: 'A1' | 'A2' | 'A3';
  lastEgfrValue?: number;
  lastProteinuriaValue?: number;
  /** Sélection du médecin référent (formulaires admin) */
  doctorId?: string;
}

export interface AppointmentFormData {
  patientId: number;
  doctorId: number;
  appointmentDate: string;
  purpose?: string;
}

export interface LabResultFormData {
  patientId: number;
  doctorId: number;
  labTestId: number;
  resultValue: number;
  resultDate: string;
}

export interface WorkflowFormData {
  name: string;
  description?: string;
  ckdStage?: string;
  requirements: {
    testName: string;
    frequency: string;
    alert: { type: string; value: string; unit?: string };
    action: string;
  }[];
}
