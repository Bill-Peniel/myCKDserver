import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { and, eq, ne } from "drizzle-orm";
import { db } from "../db";
import { users, doctors } from "../../shared/schema";
import { toSessionUser } from "../auth";
import { asyncHandler, HttpError } from "../utils";
import { doctorWithUser, serializeDoctor, serializeUser } from "../serializers";

const router = Router();

const profileSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().email(),
  specialty: z.string().optional(),
  hospital: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, "Le nouveau mot de passe doit contenir au moins 6 caractères"),
});

const preferencesSchema = z.object({
  emailNotifications: z.boolean(),
  criticalAlertsOnly: z.boolean(),
  appointmentReminders: z.boolean(),
  labResultAlerts: z.boolean(),
});

router.put("/profile", asyncHandler(async (req, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Données du profil invalides");
  const { firstName, lastName, email, specialty, hospital } = parsed.data;
  const userId = req.authUser!.id;

  const emailTaken = await db.query.users.findFirst({
    where: and(eq(users.email, email), ne(users.id, userId)),
  });
  if (emailTaken) throw new HttpError(400, "Cet email est déjà utilisé");

  const [user] = await db.update(users).set({ firstName, lastName, email }).where(eq(users.id, userId)).returning();
  if (!user) throw new HttpError(404, "Utilisateur introuvable");

  if (req.session.user) req.session.user = toSessionUser(user);

  let userDetails = null;
  if (user.role === "medecin") {
    await db.update(doctors).set({ specialty, hospital }).where(eq(doctors.userId, userId));
    const doctor = await db.query.doctors.findFirst({ where: eq(doctors.userId, userId), ...doctorWithUser });
    userDetails = doctor ? serializeDoctor(doctor) : null;
  }

  res.json({ user: serializeUser(user), userDetails });
}));

router.post("/change-password", asyncHandler(async (req, res) => {
  const parsed = passwordSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, parsed.error.errors[0]?.message ?? "Données invalides");

  const user = await db.query.users.findFirst({ where: eq(users.id, req.authUser!.id) });
  if (!user) throw new HttpError(404, "Utilisateur introuvable");

  if (!(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))) {
    throw new HttpError(401, "Mot de passe actuel incorrect");
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));
  res.json({ success: true });
}));

router.get("/notification-preferences", asyncHandler(async (req, res) => {
  const user = await db.query.users.findFirst({ where: eq(users.id, req.authUser!.id) });
  res.json(user?.notificationPreferences ?? {
    emailNotifications: true,
    criticalAlertsOnly: false,
    appointmentReminders: true,
    labResultAlerts: true,
  });
}));

router.post("/notification-preferences", asyncHandler(async (req, res) => {
  const parsed = preferencesSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Préférences invalides");
  await db.update(users).set({ notificationPreferences: parsed.data }).where(eq(users.id, req.authUser!.id));
  res.json({ success: true, preferences: parsed.data });
}));

export default router;
