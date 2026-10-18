import { Router } from "express";
import { z } from "zod";
import { and, count, desc, eq } from "drizzle-orm";
import { db } from "../db";
import { notifications, NOTIFICATION_SEVERITIES, type Doctor } from "../../shared/schema";
import { requireDoctor } from "../auth";
import { asyncHandler, HttpError, parseId } from "../utils";
import { publicUserColumns, serializeNotification } from "../serializers";
import { findOwnedPatient, parseBody } from "../services";

const router = Router();
router.use(requireDoctor);

const createSchema = z.object({
  message: z.string().trim().min(1),
  severity: z.enum(NOTIFICATION_SEVERITIES).default("info"),
  patientId: z.coerce.number().int().positive().optional(),
});

router.get("/", asyncHandler(async (_req, res) => {
  const doctor: Doctor = res.locals.doctor;
  const rows = await db.query.notifications.findMany({
    where: eq(notifications.doctorId, doctor.id),
    with: { patient: { with: { user: publicUserColumns } } },
    orderBy: desc(notifications.createdAt),
  });

  const [{ value: criticalCount }] = await db
    .select({ value: count() })
    .from(notifications)
    .where(and(
      eq(notifications.doctorId, doctor.id),
      eq(notifications.severity, "error"),
      eq(notifications.isRead, false),
    ));

  res.json({ notifications: rows.map(serializeNotification), criticalCount });
}));

router.post("/mark-read/:id", asyncHandler(async (req, res) => {
  const doctor: Doctor = res.locals.doctor;
  const [updated] = await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, parseId(req.params.id, "ID notification")), eq(notifications.doctorId, doctor.id)))
    .returning();
  if (!updated) throw new HttpError(404, "Notification introuvable");
  res.json(serializeNotification(updated));
}));

router.post("/mark-all-read", asyncHandler(async (_req, res) => {
  const doctor: Doctor = res.locals.doctor;
  const updated = await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.doctorId, doctor.id), eq(notifications.isRead, false)))
    .returning({ id: notifications.id });
  res.json({ success: true, modifiedCount: updated.length });
}));

router.post("/", asyncHandler(async (req, res) => {
  const doctor: Doctor = res.locals.doctor;
  const data = parseBody(createSchema, req.body);
  if (data.patientId) await findOwnedPatient(data.patientId, doctor.id);
  const [created] = await db.insert(notifications).values({ ...data, doctorId: doctor.id }).returning();
  res.status(201).json(serializeNotification(created));
}));

export default router;
