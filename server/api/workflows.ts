import { Router } from "express";
import { z } from "zod";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "../db";
import {
  workflows,
  workflowRequirements,
  patients,
  ALERT_TYPES,
  CKD_STAGES,
  WORKFLOW_ACTIONS,
  type Doctor,
} from "../../shared/schema";
import { requireDoctor } from "../auth";
import { asyncHandler, escapeHtml, HttpError, parseId } from "../utils";
import { serializeWorkflow, publicUserColumns } from "../serializers";
import { parseBody } from "../services";
import { emailLayout, sendEmail } from "../mailer";

const router = Router();
router.use(requireDoctor);

const requirementSchema = z.object({
  testName: z.string().trim().min(1, "Test requis"),
  frequency: z.string().trim().min(1, "Fréquence requise"),
  alert: z.object({
    type: z.enum(ALERT_TYPES),
    value: z.coerce.string().min(1, "Valeur d'alerte requise"),
    unit: z.string().optional(),
  }),
  action: z.enum(WORKFLOW_ACTIONS),
});

const workflowSchema = z.object({
  name: z.string().trim().min(1, "Nom requis"),
  description: z.string().optional(),
  ckdStage: z.preprocess((v) => (v === "" ? undefined : v), z.enum(CKD_STAGES).optional()),
  requirements: z.array(requirementSchema).default([]),
});

type WorkflowBody = z.infer<typeof workflowSchema>;

const withRequirements = {
  with: { requirements: { orderBy: asc(workflowRequirements.id) } },
} as const;

function requirementRows(workflowId: number, body: WorkflowBody) {
  return body.requirements.map((req) => ({
    workflowId,
    testName: req.testName,
    frequency: req.frequency,
    alertType: req.alert.type,
    alertValue: req.alert.value,
    alertUnit: req.alert.unit,
    action: req.action,
  }));
}

async function findOwnedWorkflow(workflowId: number, doctorId: number) {
  const workflow = await db.query.workflows.findFirst({
    where: and(eq(workflows.id, workflowId), eq(workflows.createdBy, doctorId)),
    ...withRequirements,
  });
  if (!workflow) throw new HttpError(404, "Workflow introuvable");
  return workflow;
}

router.get("/", asyncHandler(async (_req, res) => {
  const doctor: Doctor = res.locals.doctor;
  const rows = await db.query.workflows.findMany({
    where: eq(workflows.createdBy, doctor.id),
    orderBy: desc(workflows.createdAt),
    ...withRequirements,
  });
  res.json(rows.map(serializeWorkflow));
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const doctor: Doctor = res.locals.doctor;
  res.json(serializeWorkflow(await findOwnedWorkflow(parseId(req.params.id, "ID workflow"), doctor.id)));
}));

router.post("/", asyncHandler(async (req, res) => {
  const doctor: Doctor = res.locals.doctor;
  const body = parseBody(workflowSchema, req.body);

  const workflowId = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(workflows)
      .values({ name: body.name, description: body.description, ckdStage: body.ckdStage, createdBy: doctor.id })
      .returning();
    const rows = requirementRows(created.id, body);
    if (rows.length) await tx.insert(workflowRequirements).values(rows);
    return created.id;
  });
  const workflow = await findOwnedWorkflow(workflowId, doctor.id);

  // Informe les patients du médecin concernés par ce stade MRC
  if (workflow.ckdStage) {
    const concerned = await db.query.patients.findMany({
      where: and(eq(patients.doctorId, doctor.id), eq(patients.ckdStage, workflow.ckdStage)),
      with: { user: publicUserColumns },
    });
    const doctorName = `${escapeHtml(req.authUser!.firstName)} ${escapeHtml(req.authUser!.lastName)}`;
    for (const patient of concerned) {
      void sendEmail(
        patient.user.email,
        "Nouveau protocole de suivi mis en place",
        emailLayout(
          "Nouveau Protocole de Suivi",
          `<p>Cher(e) ${escapeHtml(patient.user.firstName)} ${escapeHtml(patient.user.lastName)},</p>
           <p>Votre médecin, Dr. ${doctorName}, a mis en place un nouveau protocole de suivi pour votre stade MRC (${escapeHtml(workflow.ckdStage)}).</p>
           <h3 style="color: #1e40af;">${escapeHtml(workflow.name)}</h3>
           <p>${escapeHtml(workflow.description)}</p>
           <p>N'hésitez pas à contacter votre médecin pour plus d'informations.</p>`,
        ),
      );
    }
  }

  res.status(201).json(serializeWorkflow(workflow));
}));

router.put("/:id", asyncHandler(async (req, res) => {
  const doctor: Doctor = res.locals.doctor;
  const workflowId = parseId(req.params.id, "ID workflow");
  await findOwnedWorkflow(workflowId, doctor.id);
  const body = parseBody(workflowSchema, req.body);

  await db.transaction(async (tx) => {
    await tx
      .update(workflows)
      .set({ name: body.name, description: body.description ?? null, ckdStage: body.ckdStage ?? null })
      .where(eq(workflows.id, workflowId));
    await tx.delete(workflowRequirements).where(eq(workflowRequirements.workflowId, workflowId));
    const rows = requirementRows(workflowId, body);
    if (rows.length) await tx.insert(workflowRequirements).values(rows);
  });

  res.json(serializeWorkflow(await findOwnedWorkflow(workflowId, doctor.id)));
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  const doctor: Doctor = res.locals.doctor;
  const workflowId = parseId(req.params.id, "ID workflow");
  await findOwnedWorkflow(workflowId, doctor.id);
  await db.delete(workflows).where(eq(workflows.id, workflowId));
  res.json({ success: true });
}));

export default router;
