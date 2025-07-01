// Define common interfaces used throughout the app

// Auth types
export interface AuthUser {
  id: number;
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

// Dashboard types
export interface DashboardStats {
  totalPatients: number;
  upcomingAppointments: number;
  criticalAlerts: number;
  pendingLabResults: number;
  stageDistribution: {
    'Stage 1': number;
    'Stage 2': number;
    'Stage 3A': number;
    'Stage 3B': number;
    'Stage 4': number;
    'Stage 5': number;
  };
  egfrTrend: {
    month: string;
    value: number;
  }[];
}

export interface Patient {
  id: number;
  userId: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  birthDate: string;
  gender: 'M' | 'F' | 'Autre';
  address?: string;
  phone?: string;
  ckdStage: 'Stage 1' | 'Stage 2' | 'Stage 3A' | 'Stage 3B' | 'Stage 4' | 'Stage 5';
  proteinuriaLevel?: 'A1' | 'A2' | 'A3';
  lastEgfrValue?: number | null;
  lastProteinuriaValue?: number | null;
  age?: number;
  latestEGFR?: number | null;
  lastVisit?: string | null;
}

export interface Doctor {
  id: number;
  userId: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  specialty: string;
  hospital?: string;
}

export interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  appointmentDate: string;
  purpose?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  patient?: {
    id: number;
    firstName: string;
    lastName: string;
    initials: string;
  };
  doctor?: {
    id: number;
    firstName: string;
    lastName: string;
  };
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
  testName: string;
  description?: string;
  unit?: string;
  normalMin?: number;
  normalMax?: number;
}

export interface PatientLabResult {
  id: number;
  patientId: number;
  doctorId: number;
  labTestId: number;
  resultValue: number;
  resultDate: string;
  labTest?: LabTest;
}

export interface Notification {
  id: number;
  userId: number;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Workflow {
  id: number;
  name: string;
  description?: string;
  ckdStage?: string;
  createdBy: number;
  createdAt: string;
  requirements?: WorkflowRequirement[];
}

export interface WorkflowRequirement {
  id: number;
  workflowId: number;
  testName: string;
  frequency: string;
  alertThreshold?: string;
  action?: string;
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
    alertThreshold?: string;
    action?: string;
  }[];
}
