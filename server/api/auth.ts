import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users, doctors, patients } from "../../shared/schema";
import { authenticate, signToken, toSessionUser } from "../auth";
import { asyncHandler, HttpError } from "../utils";
import { doctorWithUser, patientWithRelations, serializeDoctor, serializePatient, serializeUser } from "../serializers";

const router = Router();

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

async function loadUserDetails(userId: number, role: string) {
  if (role === "medecin") {
    const doctor = await db.query.doctors.findFirst({ where: eq(doctors.userId, userId), ...doctorWithUser });
    return doctor ? serializeDoctor(doctor) : null;
  }
  if (role === "patient") {
    const patient = await db.query.patients.findFirst({ where: eq(patients.userId, userId), ...patientWithRelations });
    return patient ? serializePatient(patient) : null;
  }
  return null;
}

router.post("/login", asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Email et mot de passe requis" });
  }
  const { email, password } = parsed.data;

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: "Email ou mot de passe incorrect" });
  }

  const sessionUser = toSessionUser(user);
  await new Promise<void>((resolve, reject) =>
    req.session.regenerate((err) => (err ? reject(err) : resolve())),
  );
  req.session.user = sessionUser;

  res.json({
    token: signToken(sessionUser),
    user: serializeUser(user),
    userDetails: await loadUserDetails(user.id, user.role),
  });
}));

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Échec de la déconnexion" });
    }
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

router.get("/me", authenticate, asyncHandler(async (req, res) => {
  const user = await db.query.users.findFirst({ where: eq(users.id, req.authUser!.id) });
  if (!user) throw new HttpError(404, "Utilisateur introuvable");
  res.json({ user: serializeUser(user), userDetails: await loadUserDetails(user.id, user.role) });
}));

export default router;
