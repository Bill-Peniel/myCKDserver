import { Router } from "express";
import { z } from "zod";
import { and, asc, eq, inArray, lt } from "drizzle-orm";
import { db } from "../db";
import { appointments, APPOINTMENT_STATUSES, type Doctor } from "../../shared/schema";
import { requireDoctor } from "../auth";
import { asyncHandler, escapeHtml, HttpError, parseId } from "../utils";
import { doctorWithUser, patientWithRelations, serializeAppointment } from "../serializers";
import { findOwnedPatient, parseBody } from "../services";
import { emailLayout, sendEmail } from "../mailer";

const router = Router();
router.use(requireDoctor);

const appointmentWithRelations = {
  with: { patient: patientWithRelations, doctor: doctorWithUser },
  orderBy: asc(appointments.appointmentDate),
} as const;

const createSchema = z.object({
  patientId: z.coerce.number({ invalid_type_error: "ID du patient requis" }).int().positive("ID du patient requis"),
  appointmentDate: z
    .string({ required_error: "Date du rendez-vous requise" })
    .transform((v) => new Date(v))
    .refine((d) => !Number.isNaN(d.getTime()), "Date du rendez-vous invalide")
    .refine((d) => d >= new Date(), "La date du rendez-vous ne peut pas être dans le passé"),
  purpose: z.string({ required_error: "Motif du rendez-vous requis" }).trim().min(1, "Motif du rendez-vous requis"),
});

const statusSchema = z.object({
  status: z.enum(APPOINTMENT_STATUSES),
  userType: z.enum(["doctor", "patient"]).optional(),
});

async function findOwnedAppointment(appointmentId: number, doctorId: number) {
  const appointment = await db.query.appointments.findFirst({ where: eq(appointments.id, appointmentId) });
  if (!appointment || appointment.doctorId !== doctorId) {
    throw new HttpError(404, "Rendez-vous introuvable");
  }
  return appointment;
}

router.get("/", asyncHandler(async (_req, res) => {
  const doctor: Doctor = res.locals.doctor;

  // Les rendez-vous passés encore en attente ou confirmés sont marqués terminés
  await db
    .update(appointments)
    .set({ doctorStatus: "completed", patientStatus: "completed" })
    .where(and(
      eq(appointments.doctorId, doctor.id),
      lt(appointments.appointmentDate, new Date()),
      inArray(appointments.doctorStatus, ["pending", "confirmed"]),
    ));

  const rows = await db.query.appointments.findMany({
    ...appointmentWithRelations,
    where: eq(appointments.doctorId, doctor.id),
  });
  res.json(rows.map(serializeAppointment));
}));

router.get("/patient/:patientId", asyncHandler(async (req, res) => {
  const doctor: Doctor = res.locals.doctor;
  const patient = await findOwnedPatient(parseId(req.params.patientId, "ID patient"), doctor.id);
  const rows = await db.query.appointments.findMany({
    ...appointmentWithRelations,
    where: eq(appointments.patientId, patient.id),
  });
  res.json(rows.map(serializeAppointment));
}));

router.post("/", asyncHandler(async (req, res) => {
  const doctor: Doctor = res.locals.doctor;
  const { patientId, appointmentDate, purpose } = parseBody(createSchema, req.body);
  const patient = await findOwnedPatient(patientId, doctor.id);

  const [created] = await db
    .insert(appointments)
    .values({ patientId, doctorId: doctor.id, appointmentDate, purpose })
    .returning();

  const doctorUser = patient.doctor?.user;
  void sendEmail(
    patient.user.email,
    "Confirmation de votre rendez-vous médical",
    emailLayout(
      "Confirmation de Rendez-vous",
      `<h2 style="color: #1e40af;">Détails du rendez-vous</h2>
       <p><strong>Date :</strong> ${appointmentDate.toLocaleDateString("fr-FR")}</p>
       <p><strong>Heure :</strong> ${appointmentDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
       <p><strong>Motif :</strong> ${escapeHtml(purpose)}</p>
       <p><strong>Médecin :</strong> Dr. ${escapeHtml(doctorUser?.firstName)} ${escapeHtml(doctorUser?.lastName)}</p>
       ${doctor.hospital ? `<p><strong>Lieu :</strong> ${escapeHtml(doctor.hospital)}</p>` : ""}`,
    ),
  );

  const appointment = await db.query.appointments.findFirst({
    ...appointmentWithRelations,
    where: eq(appointments.id, created.id),
  });
  res.status(201).json(serializeAppointment(appointment!));
}));

router.put("/:id/status", asyncHandler(async (req, res) => {
  const doctor: Doctor = res.locals.doctor;
  const appointmentId = parseId(req.params.id, "ID rendez-vous");
  const { status, userType } = parseBody(statusSchema, req.body);
  await findOwnedAppointment(appointmentId, doctor.id);

  const [updated] = await db
    .update(appointments)
    .set(userType === "patient" ? { patientStatus: status } : { doctorStatus: status })
    .where(eq(appointments.id, appointmentId))
    .returning();
  res.json(serializeAppointment(updated));
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  const doctor: Doctor = res.locals.doctor;
  const appointmentId = parseId(req.params.id, "ID rendez-vous");
  await findOwnedAppointment(appointmentId, doctor.id);
  await db.delete(appointments).where(eq(appointments.id, appointmentId));
  res.json({ success: true });
}));

export default router;
