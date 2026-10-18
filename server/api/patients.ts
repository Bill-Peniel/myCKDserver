import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import { patients, type Doctor } from "../../shared/schema";
import { requireDoctor } from "../auth";
import { asyncHandler, parseId } from "../utils";
import { patientWithRelations, serializePatient } from "../serializers";
import { createPatient, deletePatient, findOwnedPatient, parseBody, patientBodySchema, updatePatient } from "../services";

const router = Router();
router.use(requireDoctor);

router.get("/", asyncHandler(async (_req, res) => {
  const doctor: Doctor = res.locals.doctor;
  const rows = await db.query.patients.findMany({
    where: eq(patients.doctorId, doctor.id),
    orderBy: desc(patients.createdAt),
    ...patientWithRelations,
  });
  res.json(rows.map(serializePatient));
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const doctor: Doctor = res.locals.doctor;
  const patient = await findOwnedPatient(parseId(req.params.id, "ID patient"), doctor.id);
  res.json(serializePatient(patient));
}));

router.post("/", asyncHandler(async (req, res) => {
  const doctor: Doctor = res.locals.doctor;
  const data = parseBody(patientBodySchema, req.body);
  // Un médecin crée toujours ses propres patients
  const patient = await createPatient(data, doctor.id);
  res.status(201).json(serializePatient(patient));
}));

router.put("/:id", asyncHandler(async (req, res) => {
  const doctor: Doctor = res.locals.doctor;
  const patientId = parseId(req.params.id, "ID patient");
  await findOwnedPatient(patientId, doctor.id);
  const data = parseBody(patientBodySchema, req.body);
  const patient = await updatePatient(patientId, data);
  res.json(serializePatient(patient));
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  const doctor: Doctor = res.locals.doctor;
  const patientId = parseId(req.params.id, "ID patient");
  await findOwnedPatient(patientId, doctor.id);
  await deletePatient(patientId);
  res.json({ success: true });
}));

export default router;
