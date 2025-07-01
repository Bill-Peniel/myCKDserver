import { pgTable, text, serial, integer, boolean, date, timestamp, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum('role', ['patient', 'medecin', 'admin']);
export const genderEnum = pgEnum('gender', ['M', 'F', 'Autre']);
export const appointmentStatusEnum = pgEnum('appointment_status', ['pending', 'confirmed', 'cancelled', 'completed']);
export const ckdStageEnum = pgEnum('ckd_stage', ['Stage 1', 'Stage 2', 'Stage 3A', 'Stage 3B', 'Stage 4', 'Stage 5']);
export const proteinuriaLevelEnum = pgEnum('proteinuria_level', ['A1', 'A2', 'A3']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ['patient', 'medecin', 'admin'] }).notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// Patients table
export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id),
  birthDate: date("birth_date").notNull(),
  gender: text("gender", { enum: ['M', 'F', 'Autre'] }).notNull(),
  address: text("address"),
  phone: text("phone"),
  ckdStage: text("ckd_stage", { enum: ['Stage 1', 'Stage 2', 'Stage 3A', 'Stage 3B', 'Stage 4', 'Stage 5'] }).notNull(),
  proteinuriaLevel: text("proteinuria_level", { enum: ['A1', 'A2', 'A3'] }).default('A1'),
  lastEgfrValue: decimal("last_egfr_value", { precision: 10, scale: 2 }),
  lastProteinuriaValue: decimal("last_proteinuria_value", { precision: 10, scale: 2 })
});

// Doctors table
export const doctors = pgTable("doctors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id),
  specialty: text("specialty").notNull(),
  hospital: text("hospital")
});

// Lab tests table
export const labTests = pgTable("lab_tests", {
  id: serial("id").primaryKey(),
  testName: text("test_name").notNull(),
  description: text("description"),
  unit: text("unit"),
  normalMin: decimal("normal_min", { precision: 10, scale: 2 }),
  normalMax: decimal("normal_max", { precision: 10, scale: 2 })
});

// Patient lab results table
export const patientLabResults = pgTable("patient_lab_results", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  doctorId: integer("doctor_id").notNull().references(() => doctors.id),
  labTestId: integer("lab_test_id").notNull().references(() => labTests.id),
  resultValue: decimal("result_value", { precision: 10, scale: 2 }).notNull(),
  resultDate: date("result_date").notNull()
});

// Appointments table
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  doctorId: integer("doctor_id").notNull().references(() => doctors.id),
  appointmentDate: timestamp("appointment_date").notNull(),
  purpose: text("purpose"),
  status: text("status", { enum: ['pending', 'confirmed', 'cancelled', 'completed'] }).default('pending')
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

// Workflows table
export const workflows = pgTable("workflows", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  ckdStage: text("ckd_stage", { enum: ['Stage 1', 'Stage 2', 'Stage 3A', 'Stage 3B', 'Stage 4', 'Stage 5'] }),
  createdBy: integer("created_by").notNull().references(() => doctors.id),
  createdAt: timestamp("created_at").defaultNow()
});

// Workflow requirements table
export const workflowRequirements = pgTable("workflow_requirements", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull().references(() => workflows.id),
  testName: text("test_name").notNull(),
  frequency: text("frequency").notNull(),
  alertThreshold: text("alert_threshold"),
  action: text("action")
});

// Schema validations
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertPatientSchema = createInsertSchema(patients).omit({ id: true });
export const insertDoctorSchema = createInsertSchema(doctors).omit({ id: true });
export const insertLabTestSchema = createInsertSchema(labTests).omit({ id: true });
export const insertPatientLabResultSchema = createInsertSchema(patientLabResults).omit({ id: true });
export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true });
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
