import { Router } from "express";
import { z } from "zod";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db";
import {
  labTests,
  patientLabResults,
  patients,
  notifications,
  type Doctor,
  type LabTest,
} from "../../shared/schema";
import { requireDoctor, requireRole } from "../auth";
import { ageFromBirthDate, asyncHandler, calculateMDRD, determineCKDStage, escapeHtml, HttpError, parseId, parseNumber } from "../utils";
import { doctorWithUser, patientWithRelations, serializeLabResult, serializeLabTest } from "../serializers";
import { findOwnedPatient, parseBody } from "../services";
import { emailLayout, sendEmail } from "../mailer";

export const DFG_TEST_NAME = "DFG estimé";

const resultWithRelations = {
  with: { labTest: true, patient: patientWithRelations, doctor: doctorWithUser },
} as const;

const newestFirst = [desc(patientLabResults.resultDate), desc(patientLabResults.id)];

const labTestSchema = z.object({
  testName: z.string().trim().min(1),
  description: z.string().optional(),
  unit: z.string().optional(),
  normalMin: z.coerce.number().optional(),
  normalMax: z.coerce.number().optional(),
  category: z.string().optional(),
});

const labResultSchema = z.object({
  patientId: z.coerce.number().int().positive(),
  labTestId: z.coerce.number().int().positive(),
  resultValue: z.preprocess(parseNumber, z.number({ invalid_type_error: "La valeur du résultat doit être un nombre valide" }).finite()),
  resultDate: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : new Date()))
    .refine((d) => !Number.isNaN(d.getTime()), "Date invalide")
    .transform((d) => d.toISOString().slice(0, 10)),
});

function isCreatinine(test: LabTest) {
  return test.testName.toLowerCase().startsWith("créatinine");
}

function isDfgRelated(test: LabTest) {
  const name = test.testName.toLowerCase();
  return name.includes("dfg") || isCreatinine(test);
}

// Classe un résultat par rapport aux valeurs normales du test
function classifyResult(test: LabTest, value: number) {
  const unit = test.unit ?? "";
  const { normalMin: min, normalMax: max } = test;
  const below = min !== null && value < min;
  const above = max !== null && value > max;

  let deviation = 0;
  if (below && min) deviation = (min - value) / Math.abs(min);
  if (above && max) deviation = (value - max) / Math.abs(max);

  if ((below || above) && deviation > 0.3) {
    return {
      severity: "error" as const,
      message: below
        ? `ALERTE : niveau dangereusement bas pour ${test.testName} : ${value} ${unit}`
        : `ALERTE : niveau dangereusement élevé pour ${test.testName} : ${value} ${unit}`,
    };
  }
  if (below || above) {
    return {
      severity: isDfgRelated(test) ? ("dfg" as const) : ("warning" as const),
      message: `Attention : résultat anormal pour ${test.testName} : ${value} ${unit}`,
    };
  }
  return {
    severity: isDfgRelated(test) ? ("dfg" as const) : ("info" as const),
    message: `Nouveau résultat normal pour ${test.testName} : ${value} ${unit}`,
  };
}

// --- /api/lab-tests ---
export const labTestsRouter = Router();

labTestsRouter.get("/", asyncHandler(async (_req, res) => {
  const rows = await db.select().from(labTests).orderBy(asc(labTests.category), asc(labTests.testName));
  res.json(rows.map(serializeLabTest));
}));

labTestsRouter.post("/", requireRole("admin", "medecin"), asyncHandler(async (req, res) => {
  const data = parseBody(labTestSchema, req.body);
  const [test] = await db.insert(labTests).values(data).returning();
  res.status(201).json(serializeLabTest(test));
}));

// --- /api/patient-lab-results ---
export const labResultsRouter = Router();

labResultsRouter.get("/", asyncHandler(async (req, res) => {
  if (req.authUser!.role === "admin") {
    const rows = await db.query.patientLabResults.findMany({ ...resultWithRelations, orderBy: newestFirst });
    return res.json(rows.map(serializeLabResult));
  }
  // Le médecin ne voit que les résultats de ses patients
  return requireDoctor(req, res, async () => {
    const doctor: Doctor = res.locals.doctor;
    const rows = await db.query.patientLabResults.findMany({
      ...resultWithRelations,
      orderBy: newestFirst,
      where: inArray(
        patientLabResults.patientId,
        db.select({ id: patients.id }).from(patients).where(eq(patients.doctorId, doctor.id)),
      ),
    });
    res.json(rows.map(serializeLabResult));
  });
}));

labResultsRouter.get("/patient/:patientId", requireDoctor, asyncHandler(async (req, res) => {
  const doctor: Doctor = res.locals.doctor;
  const patient = await findOwnedPatient(parseId(req.params.patientId, "ID patient"), doctor.id);
  const rows = await db.query.patientLabResults.findMany({
    ...resultWithRelations,
    orderBy: newestFirst,
    where: eq(patientLabResults.patientId, patient.id),
  });
  res.json(rows.map(serializeLabResult));
}));

labResultsRouter.post("/", requireDoctor, asyncHandler(async (req, res) => {
  const doctor: Doctor = res.locals.doctor;
  const { patientId, labTestId, resultValue, resultDate } = parseBody(labResultSchema, req.body);

  const patient = await findOwnedPatient(patientId, doctor.id);
  const labTest = await db.query.labTests.findFirst({ where: eq(labTests.id, labTestId) });
  if (!labTest) throw new HttpError(400, "Test de laboratoire introuvable");
  if (isCreatinine(labTest) && resultValue <= 0) throw new HttpError(400, "Valeur de créatinine invalide");

  const patientName = `${patient.user.firstName} ${patient.user.lastName}`;
  const classification = classifyResult(labTest, resultValue);

  const result = await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(patientLabResults)
      .values({ patientId, doctorId: doctor.id, labTestId, resultValue, resultDate })
      .returning();

    await tx.insert(notifications).values({
      doctorId: doctor.id,
      patientId,
      labTestId,
      labResultId: inserted.id,
      message: `Patient ${patientName} : ${classification.message}`,
      severity: classification.severity,
    });

    // Créatinine sanguine : calcul du DFG (MDRD) et mise à jour du stade MRC
    if (isCreatinine(labTest)) {
      const dfg = calculateMDRD(resultValue, ageFromBirthDate(patient.birthDate), patient.gender === "F");
      const dfgTest = await tx.query.labTests.findFirst({ where: eq(labTests.testName, DFG_TEST_NAME) });
      if (dfgTest) {
        await tx.insert(patientLabResults).values({ patientId, doctorId: doctor.id, labTestId: dfgTest.id, resultValue: dfg, resultDate });
      }

      const newStage = determineCKDStage(dfg);
      if (patient.ckdStage !== newStage) {
        await tx.update(patients).set({ ckdStage: newStage }).where(eq(patients.id, patientId));
        await tx.insert(notifications).values({
          doctorId: doctor.id,
          patientId,
          labTestId: dfgTest?.id ?? null,
          message: `Le stade MRC de ${patientName} a changé : ${newStage.replace("Stage", "Stade")} (DFG : ${dfg} mL/min/1.73m²)`,
          severity: "warning",
        });
      }
    }

    return inserted;
  });

  const range = labTest.normalMin !== null && labTest.normalMax !== null
    ? `<p><strong>Plage normale :</strong> ${labTest.normalMin} - ${labTest.normalMax} ${escapeHtml(labTest.unit)}</p>`
    : "";
  void sendEmail(
    patient.user.email,
    "Nouveau résultat de laboratoire",
    emailLayout(
      "Système de Suivi MRC",
      `<h2 style="color: #1e40af;">Nouveau résultat de test</h2>
       <p><strong>Test :</strong> ${escapeHtml(labTest.testName)}</p>
       <p><strong>Valeur :</strong> ${resultValue} ${escapeHtml(labTest.unit)}</p>
       ${range}
       <p><strong>Date du test :</strong> ${new Date(resultDate).toLocaleDateString("fr-FR")}</p>
       <p>Votre médecin, Dr. ${escapeHtml(patient.doctor?.user.firstName)} ${escapeHtml(patient.doctor?.user.lastName)}, a été notifié de ces résultats.</p>`,
      "Pour toute question, veuillez contacter votre médecin.",
    ),
  );

  res.status(201).json(serializeLabResult({ ...result, labTest }));
}));

labResultsRouter.delete("/:id", requireDoctor, asyncHandler(async (req, res) => {
  const doctor: Doctor = res.locals.doctor;
  const resultId = parseId(req.params.id, "ID résultat");
  const result = await db.query.patientLabResults.findFirst({
    where: eq(patientLabResults.id, resultId),
    with: { patient: true },
  });
  if (!result || result.patient.doctorId !== doctor.id) {
    throw new HttpError(404, "Résultat introuvable");
  }
  // Les notifications liées sont supprimées en cascade
  await db.delete(patientLabResults).where(eq(patientLabResults.id, resultId));
  res.json({ success: true });
}));
