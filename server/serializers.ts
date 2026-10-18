// Mise en forme des réponses de l'API.
// Le frontend a été écrit pour l'ancienne API MongoDB : il utilise `_id` (chaîne)
// et attend des objets liés imbriqués (patient.user, result.labTest, ...).
// On renvoie donc `_id` en plus de `id`, et on garde ces imbrications.
import type {
  User,
  Doctor,
  Patient,
  LabTest,
  PatientLabResult,
  Appointment,
  Notification,
  Workflow,
  WorkflowRequirement,
} from "../shared/schema";
import { ageFromBirthDate } from "./utils";

// Colonnes utilisateur exposées (jamais le hash du mot de passe)
export const publicUserColumns = {
  columns: { passwordHash: false, notificationPreferences: false },
} as const;

export const doctorWithUser = { with: { user: publicUserColumns } } as const;

export const patientWithRelations = {
  with: { user: publicUserColumns, doctor: doctorWithUser },
} as const;

type PublicUser = Omit<User, "passwordHash" | "notificationPreferences">;
type DoctorRow = Doctor & { user: PublicUser };
type PatientRow = Patient & { user: PublicUser; doctor?: DoctorRow | null };

function withMongoId<T extends { id: number }>(row: T) {
  return { ...row, _id: String(row.id) };
}

export function serializeUser(user: PublicUser | User) {
  const { passwordHash: _hash, notificationPreferences: _prefs, ...rest } = user as User;
  return withMongoId(rest);
}

export function serializeDoctor(doctor: DoctorRow) {
  return { ...withMongoId(doctor), user: serializeUser(doctor.user) };
}

export function serializePatient(patient: PatientRow) {
  return {
    ...withMongoId(patient),
    user: serializeUser(patient.user),
    doctor: patient.doctor ? serializeDoctor(patient.doctor) : null,
    age: ageFromBirthDate(patient.birthDate),
  };
}

export function serializeLabTest(test: LabTest) {
  return withMongoId(test);
}

export function serializeLabResult(
  result: PatientLabResult & { labTest: LabTest; patient?: PatientRow | null; doctor?: DoctorRow | null },
) {
  return {
    ...withMongoId(result),
    labTest: serializeLabTest(result.labTest),
    patient: result.patient ? serializePatient(result.patient) : String(result.patientId),
    doctor: result.doctor ? serializeDoctor(result.doctor) : null,
  };
}

export function serializeAppointment(
  appointment: Appointment & { patient?: PatientRow | null; doctor?: DoctorRow | null },
) {
  return {
    ...withMongoId(appointment),
    status: appointment.doctorStatus,
    patient: appointment.patient ? serializePatient(appointment.patient) : null,
    doctor: appointment.doctor ? serializeDoctor(appointment.doctor) : null,
  };
}

// `patientId` est l'objet patient complet (comme le populate Mongo d'origine)
export function serializeNotification(notification: Notification & { patient?: PatientRow | null }) {
  const { patient, ...rest } = notification;
  return {
    ...withMongoId(rest),
    patientId: patient ? { ...withMongoId(patient), user: serializeUser(patient.user) } : null,
    doctorId: String(notification.doctorId),
    labTest: notification.labTestId ? String(notification.labTestId) : null,
  };
}

export function serializeWorkflow(workflow: Workflow & { requirements: WorkflowRequirement[] }) {
  return {
    ...withMongoId(workflow),
    createdBy: String(workflow.createdBy),
    requirements: workflow.requirements.map((req) => ({
      _id: String(req.id),
      id: req.id,
      testName: req.testName,
      frequency: req.frequency,
      alert: { type: req.alertType, value: req.alertValue, unit: req.alertUnit ?? "" },
      action: req.action,
    })),
  };
}
