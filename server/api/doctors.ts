import { Router } from "express";
import { asc, eq } from "drizzle-orm";
import { db } from "../db";
import { doctors } from "../../shared/schema";
import { asyncHandler, HttpError, parseId } from "../utils";
import { doctorWithUser, serializeDoctor } from "../serializers";
import { findDoctor } from "../services";

const router = Router();

router.get("/", asyncHandler(async (_req, res) => {
  const rows = await db.query.doctors.findMany({ orderBy: asc(doctors.id), ...doctorWithUser });
  res.json(rows.map(serializeDoctor));
}));

router.get("/user/:userId", asyncHandler(async (req, res) => {
  const userId = parseId(req.params.userId, "ID utilisateur");
  const doctor = await db.query.doctors.findFirst({ where: eq(doctors.userId, userId), ...doctorWithUser });
  if (!doctor) throw new HttpError(404, "Médecin introuvable");
  res.json(serializeDoctor(doctor));
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const doctor = await findDoctor(parseId(req.params.id, "ID médecin"));
  if (!doctor) throw new HttpError(404, "Médecin introuvable");
  res.json(serializeDoctor(doctor));
}));

export default router;
