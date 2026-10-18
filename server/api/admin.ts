import { Router, type Request } from "express";
import { asc, count, desc } from "drizzle-orm";
import { db } from "../db";
import { appointments, doctors, patientLabResults, patients, users, workflows, workflowRequirements } from "../../shared/schema";
import { requireRole } from "../auth";
import { asyncHandler, parseId } from "../utils";
import {
  doctorWithUser,
  patientWithRelations,
  serializeAppointment,
  serializeDoctor,
  serializeLabResult,
  serializePatient,
  serializeWorkflow,
} from "../serializers";
import {
  createDoctor,
  createPatient,
  deleteDoctor,
  deletePatient,
  resetDoctorPassword,
  doctorBodySchema,
  parseBody,
  patientBodySchema,
  updateDoctor,
  updatePatient,
} from "../services";
import { sendDoctorCredentials } from "../mailer";

const router = Router();
router.use(requireRole("admin"));

router.get("/stats", asyncHandler(async (_req, res) => {
  const [[d], [p], [u], [a], [r], byStage] = await Promise.all([
    db.select({ value: count() }).from(doctors),
    db.select({ value: count() }).from(patients),
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(appointments),
    db.select({ value: count() }).from(patientLabResults),
    db.select({ stage: patients.ckdStage, count: count() }).from(patients).groupBy(patients.ckdStage).orderBy(asc(patients.ckdStage)),
  ]);

  res.json({
    totalDoctors: d.value,
    totalPatients: p.value,
    totalUsers: u.value,
    totalAppointments: a.value,
    totalLabResults: r.value,
    // Format hérité de l'agrégation Mongo : { _id: stade, count }
    patientsByStage: byStage.map((s) => ({ _id: s.stage, count: s.count })),
  });
}));

// --- Médecins ---
router.get("/doctors", asyncHandler(async (_req, res) => {
  const rows = await db.query.doctors.findMany({ orderBy: asc(doctors.id), ...doctorWithUser });
  res.json(rows.map(serializeDoctor));
}));

// URL de la page de connexion, pour le lien de l'e-mail
function loginUrl(req: Request) {
  const base = process.env.APP_URL?.replace(/\/$/, "") || `${req.protocol}://${req.get("host")}`;
  return `${base}/login`;
}

// Envoie les identifiants ; si l'e-mail échoue, le mot de passe est renvoyé à l'admin pour transmission
async function deliverCredentials(req: Request, doctor: Awaited<ReturnType<typeof createDoctor>>["doctor"], temporaryPassword: string, isReset = false) {
  const emailSent = await sendDoctorCredentials({
    to: doctor.user.email,
    firstName: doctor.user.firstName,
    lastName: doctor.user.lastName,
    temporaryPassword,
    loginUrl: loginUrl(req),
    isReset,
  });
  return emailSent ? { emailSent } : { emailSent, temporaryPassword };
}

router.post("/doctors", asyncHandler(async (req, res) => {
  const { doctor, temporaryPassword } = await createDoctor(parseBody(doctorBodySchema, req.body));
  const invitation = await deliverCredentials(req, doctor, temporaryPassword);
  res.status(201).json({ ...serializeDoctor(doctor), invitation });
}));

router.post("/doctors/:id/send-credentials", asyncHandler(async (req, res) => {
  const { doctor, temporaryPassword } = await resetDoctorPassword(parseId(req.params.id, "ID médecin"));
  const invitation = await deliverCredentials(req, doctor, temporaryPassword, true);
  res.json({ ...serializeDoctor(doctor), invitation });
}));

router.put("/doctors/:id", asyncHandler(async (req, res) => {
  const doctor = await updateDoctor(parseId(req.params.id, "ID médecin"), parseBody(doctorBodySchema, req.body));
  res.json(serializeDoctor(doctor));
}));

router.delete("/doctors/:id", asyncHandler(async (req, res) => {
  await deleteDoctor(parseId(req.params.id, "ID médecin"));
  res.json({ success: true });
}));

// --- Patients ---
router.get("/patients", asyncHandler(async (_req, res) => {
  const rows = await db.query.patients.findMany({ orderBy: desc(patients.createdAt), ...patientWithRelations });
  res.json(rows.map(serializePatient));
}));

router.post("/patients", asyncHandler(async (req, res) => {
  const data = parseBody(patientBodySchema, req.body);
  const patient = await createPatient(data, data.doctorId ?? null);
  res.status(201).json(serializePatient(patient));
}));

router.put("/patients/:id", asyncHandler(async (req, res) => {
  const data = parseBody(patientBodySchema, req.body);
  const patient = await updatePatient(parseId(req.params.id, "ID patient"), data, data.doctorId);
  res.json(serializePatient(patient));
}));

router.delete("/patients/:id", asyncHandler(async (req, res) => {
  await deletePatient(parseId(req.params.id, "ID patient"));
  res.json({ success: true });
}));

// --- Consultation ---
router.get("/appointments", asyncHandler(async (_req, res) => {
  const rows = await db.query.appointments.findMany({
    with: { patient: patientWithRelations, doctor: doctorWithUser },
    orderBy: desc(appointments.appointmentDate),
  });
  res.json(rows.map(serializeAppointment));
}));

router.get("/lab-results", asyncHandler(async (_req, res) => {
  const rows = await db.query.patientLabResults.findMany({
    with: { labTest: true, patient: patientWithRelations, doctor: doctorWithUser },
    orderBy: [desc(patientLabResults.resultDate), desc(patientLabResults.id)],
  });
  res.json(rows.map(serializeLabResult));
}));

router.get("/workflows", asyncHandler(async (_req, res) => {
  const rows = await db.query.workflows.findMany({
    with: { requirements: { orderBy: asc(workflowRequirements.id) }, creator: doctorWithUser },
    orderBy: desc(workflows.createdAt),
  });
  res.json(rows.map((w) => ({ ...serializeWorkflow(w), creator: serializeDoctor(w.creator) })));
}));

export default router;
