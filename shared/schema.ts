import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  date,
  timestamp,
  doublePrecision,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Valeurs autorisées
export const ROLES = ["patient", "medecin", "admin"] as const;
export const GENDERS = ["M", "F", "Autre"] as const;
export const CKD_STAGES = ["Stage 1", "Stage 2", "Stage 3A", "Stage 3B", "Stage 4", "Stage 5"] as const;
export const PROTEINURIA_LEVELS = ["A1", "A2", "A3"] as const;
export const APPOINTMENT_STATUSES = ["pending", "confirmed", "cancelled", "completed"] as const;
export const NOTIFICATION_SEVERITIES = ["info", "warning", "error", "dfg"] as const;
export const ALERT_TYPES = ["Inférieur à", "Supérieur à"] as const;
export const WORKFLOW_ACTIONS = ["Notification", "Email"] as const;

export type CkdStage = (typeof CKD_STAGES)[number];

export type NotificationPreferences = {
  emailNotifications: boolean;
  criticalAlertsOnly: boolean;
  appointmentReminders: boolean;
  labResultAlerts: boolean;
};

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ROLES }).notNull(),
  notificationPreferences: jsonb("notification_preferences").$type<NotificationPreferences>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Doctors table (profil médecin lié à un utilisateur)
export const doctors = pgTable("doctors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  specialty: text("specialty"),
  hospital: text("hospital"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Patients table (profil patient lié à un utilisateur)
export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  doctorId: integer("doctor_id").references(() => doctors.id, { onDelete: "set null" }),
  birthDate: date("birth_date").notNull(),
  gender: text("gender", { enum: GENDERS }).notNull(),
  address: text("address"),
  phone: text("phone"),
  ckdStage: text("ckd_stage", { enum: CKD_STAGES }),
  proteinuriaLevel: text("proteinuria_level", { enum: PROTEINURIA_LEVELS }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("patients_doctor_idx").on(t.doctorId)]);

// Lab tests table
export const labTests = pgTable("lab_tests", {
  id: serial("id").primaryKey(),
  testName: text("test_name").notNull().unique(),
  description: text("description"),
  unit: text("unit"),
  normalMin: doublePrecision("normal_min"),
  normalMax: doublePrecision("normal_max"),
  category: text("category"),
});

// Patient lab results table
export const patientLabResults = pgTable("patient_lab_results", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  doctorId: integer("doctor_id").references(() => doctors.id, { onDelete: "set null" }),
  labTestId: integer("lab_test_id").notNull().references(() => labTests.id, { onDelete: "restrict" }),
  resultValue: doublePrecision("result_value").notNull(),
  resultDate: date("result_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("lab_results_patient_idx").on(t.patientId)]);

// Appointments table
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  doctorId: integer("doctor_id").notNull().references(() => doctors.id, { onDelete: "cascade" }),
  appointmentDate: timestamp("appointment_date", { withTimezone: true }).notNull(),
  purpose: text("purpose"),
  doctorStatus: text("doctor_status", { enum: APPOINTMENT_STATUSES }).notNull().default("pending"),
  patientStatus: text("patient_status", { enum: APPOINTMENT_STATUSES }).notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("appointments_doctor_idx").on(t.doctorId)]);

// Notifications table (destinées au médecin)
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").notNull().references(() => doctors.id, { onDelete: "cascade" }),
  patientId: integer("patient_id").references(() => patients.id, { onDelete: "cascade" }),
  labTestId: integer("lab_test_id").references(() => labTests.id, { onDelete: "set null" }),
  labResultId: integer("lab_result_id").references(() => patientLabResults.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  severity: text("severity", { enum: NOTIFICATION_SEVERITIES }).notNull().default("info"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("notifications_doctor_idx").on(t.doctorId)]);

// Workflows table
export const workflows = pgTable("workflows", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  ckdStage: text("ckd_stage", { enum: CKD_STAGES }),
  createdBy: integer("created_by").notNull().references(() => doctors.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Workflow requirements table
export const workflowRequirements = pgTable("workflow_requirements", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull().references(() => workflows.id, { onDelete: "cascade" }),
  testName: text("test_name").notNull(),
  frequency: text("frequency").notNull(),
  alertType: text("alert_type", { enum: ALERT_TYPES }).notNull(),
  alertValue: text("alert_value").notNull(),
  alertUnit: text("alert_unit"),
  action: text("action", { enum: WORKFLOW_ACTIONS }).notNull(),
});

// Relations (utilisées par db.query.* pour charger les données liées)
export const usersRelations = relations(users, ({ one }) => ({
  doctor: one(doctors, { fields: [users.id], references: [doctors.userId] }),
  patient: one(patients, { fields: [users.id], references: [patients.userId] }),
}));

export const doctorsRelations = relations(doctors, ({ one, many }) => ({
  user: one(users, { fields: [doctors.userId], references: [users.id] }),
  patients: many(patients),
}));

export const patientsRelations = relations(patients, ({ one, many }) => ({
  user: one(users, { fields: [patients.userId], references: [users.id] }),
  doctor: one(doctors, { fields: [patients.doctorId], references: [doctors.id] }),
  labResults: many(patientLabResults),
  appointments: many(appointments),
}));

export const patientLabResultsRelations = relations(patientLabResults, ({ one }) => ({
  patient: one(patients, { fields: [patientLabResults.patientId], references: [patients.id] }),
  doctor: one(doctors, { fields: [patientLabResults.doctorId], references: [doctors.id] }),
  labTest: one(labTests, { fields: [patientLabResults.labTestId], references: [labTests.id] }),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  patient: one(patients, { fields: [appointments.patientId], references: [patients.id] }),
  doctor: one(doctors, { fields: [appointments.doctorId], references: [doctors.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  doctor: one(doctors, { fields: [notifications.doctorId], references: [doctors.id] }),
  patient: one(patients, { fields: [notifications.patientId], references: [patients.id] }),
  labTest: one(labTests, { fields: [notifications.labTestId], references: [labTests.id] }),
}));

export const workflowsRelations = relations(workflows, ({ one, many }) => ({
  creator: one(doctors, { fields: [workflows.createdBy], references: [doctors.id] }),
  requirements: many(workflowRequirements),
}));

export const workflowRequirementsRelations = relations(workflowRequirements, ({ one }) => ({
  workflow: one(workflows, { fields: [workflowRequirements.workflowId], references: [workflows.id] }),
}));

// Schema validations
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertPatientSchema = createInsertSchema(patients).omit({ id: true, createdAt: true });
export const insertDoctorSchema = createInsertSchema(doctors).omit({ id: true, createdAt: true });
export const insertLabTestSchema = createInsertSchema(labTests).omit({ id: true });
export const insertPatientLabResultSchema = createInsertSchema(patientLabResults).omit({ id: true, createdAt: true });
export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertWorkflowSchema = createInsertSchema(workflows).omit({ id: true, createdAt: true });
export const insertWorkflowRequirementSchema = createInsertSchema(workflowRequirements).omit({ id: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;

export type Doctor = typeof doctors.$inferSelect;
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;

export type LabTest = typeof labTests.$inferSelect;
export type InsertLabTest = z.infer<typeof insertLabTestSchema>;

export type PatientLabResult = typeof patientLabResults.$inferSelect;
export type InsertPatientLabResult = z.infer<typeof insertPatientLabResultSchema>;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;

export type WorkflowRequirement = typeof workflowRequirements.$inferSelect;
export type InsertWorkflowRequirement = z.infer<typeof insertWorkflowRequirementSchema>;
