import bcrypt from "bcrypt";
import crypto from "crypto";
import { z } from "zod";
import { and, eq, ne } from "drizzle-orm";
import { db } from "./db";
import { users, doctors, patients, CKD_STAGES, GENDERS, PROTEINURIA_LEVELS } from "../shared/schema";
import { HttpError } from "./utils";
import { doctorWithUser, patientWithRelations } from "./serializers";

// Les formulaires envoient "" pour les champs vides
const optionalText = z.preprocess((v) => (v === "" || v === null ? undefined : v), z.string().trim().optional());
const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess((v) => (v === "" || v === null ? undefined : v), z.enum(values).optional());

const isoDate = z
  .string()
  .min(1)
  .refine((v) => !Number.isNaN(new Date(v).getTime()), "Date invalide")
  .transform((v) => new Date(v).toISOString().slice(0, 10));

export const patientBodySchema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis"),
  lastName: z.string().trim().min(1, "Nom requis"),
  email: z.string().trim().toLowerCase().email("Email invalide"),
  birthDate: isoDate,
  gender: z.enum(GENDERS),
  address: optionalText,
  phone: optionalText,
  ckdStage: optionalEnum(CKD_STAGES),
  proteinuriaLevel: optionalEnum(PROTEINURIA_LEVELS),
  doctorId: z.preprocess((v) => (v === "" || v === null ? undefined : v), z.coerce.number().int().positive().optional()),
});

export const doctorBodySchema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis"),
  lastName: z.string().trim().min(1, "Nom requis"),
  email: z.string().trim().toLowerCase().email("Email invalide"),
  password: optionalText,
  specialty: optionalText,
  hospital: optionalText,
});

export type PatientBody = z.infer<typeof patientBodySchema>;
export type DoctorBody = z.infer<typeof doctorBodySchema>;

export function parseBody<T extends z.ZodTypeAny>(schema: T, body: unknown): z.infer<T> {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.errors[0]?.message ?? "Données invalides");
  }
  return parsed.data;
}

async function assertEmailAvailable(email: string, exceptUserId?: number) {
  const existing = await db.query.users.findFirst({
    where: exceptUserId ? and(eq(users.email, email), ne(users.id, exceptUserId)) : eq(users.email, email),
  });
  if (existing) throw new HttpError(400, "Un utilisateur avec cet email existe déjà");
}

export async function findPatient(patientId: number) {
  return db.query.patients.findFirst({ where: eq(patients.id, patientId), ...patientWithRelations });
}

export async function findDoctor(doctorId: number) {
  return db.query.doctors.findFirst({ where: eq(doctors.id, doctorId), ...doctorWithUser });
}

// Patient appartenant au médecin, sinon 404
export async function findOwnedPatient(patientId: number, doctorId: number) {
  const patient = await findPatient(patientId);
  if (!patient || patient.doctorId !== doctorId) {
    throw new HttpError(404, "Patient introuvable");
  }
  return patient;
}

export async function createPatient(data: PatientBody, doctorId: number | null) {
  await assertEmailAvailable(data.email);
  if (doctorId && !(await findDoctor(doctorId))) throw new HttpError(400, "Médecin introuvable");

  // Les patients n'ont pas accès à l'application : mot de passe aléatoire
  const passwordHash = await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10);
  const { firstName, lastName, email, doctorId: _ignored, ...patientFields } = data;

  const patientId = await db.transaction(async (tx) => {
    const [user] = await tx.insert(users).values({ firstName, lastName, email, passwordHash, role: "patient" }).returning();
    const [patient] = await tx.insert(patients).values({ ...patientFields, userId: user.id, doctorId }).returning();
    return patient.id;
  });
  return (await findPatient(patientId))!;
}

export async function updatePatient(patientId: number, data: PatientBody, doctorId?: number | null) {
  const existing = await db.query.patients.findFirst({ where: eq(patients.id, patientId) });
  if (!existing) throw new HttpError(404, "Patient introuvable");
  await assertEmailAvailable(data.email, existing.userId);
  if (doctorId && !(await findDoctor(doctorId))) throw new HttpError(400, "Médecin introuvable");

  const { firstName, lastName, email, doctorId: _ignored, ...patientFields } = data;
  await db.transaction(async (tx) => {
    await tx.update(users).set({ firstName, lastName, email }).where(eq(users.id, existing.userId));
    await tx
      .update(patients)
      .set({
        ...patientFields,
        address: patientFields.address ?? null,
        phone: patientFields.phone ?? null,
        ...(doctorId !== undefined ? { doctorId } : {}),
      })
      .where(eq(patients.id, patientId));
  });
  return (await findPatient(patientId))!;
}

// La suppression de l'utilisateur supprime en cascade le patient et ses données
export async function deletePatient(patientId: number) {
  const existing = await db.query.patients.findFirst({ where: eq(patients.id, patientId) });
  if (!existing) throw new HttpError(404, "Patient introuvable");
  await db.delete(users).where(eq(users.id, existing.userId));
}

// Mot de passe temporaire lisible (sans caractères ambigus : 0/O, 1/l/I)
export function generateTemporaryPassword(length = 12): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  return Array.from({ length }, () => alphabet[crypto.randomInt(alphabet.length)]).join("");
}

// Création par l'administrateur : le mot de passe est généré puis envoyé au médecin
export async function createDoctor(data: DoctorBody) {
  await assertEmailAvailable(data.email);
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  const doctorId = await db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({ firstName: data.firstName, lastName: data.lastName, email: data.email, passwordHash, role: "medecin" })
      .returning();
    const [doctor] = await tx
      .insert(doctors)
      .values({ userId: user.id, specialty: data.specialty, hospital: data.hospital })
      .returning();
    return doctor.id;
  });
  return { doctor: (await findDoctor(doctorId))!, temporaryPassword };
}

// Génère un nouveau mot de passe temporaire (renvoi des identifiants)
export async function resetDoctorPassword(doctorId: number) {
  const doctor = await findDoctor(doctorId);
  if (!doctor) throw new HttpError(404, "Médecin introuvable");
  const temporaryPassword = generateTemporaryPassword();
  await db
    .update(users)
    .set({ passwordHash: await bcrypt.hash(temporaryPassword, 10) })
    .where(eq(users.id, doctor.userId));
  return { doctor, temporaryPassword };
}

export async function updateDoctor(doctorId: number, data: DoctorBody) {
  const existing = await db.query.doctors.findFirst({ where: eq(doctors.id, doctorId) });
  if (!existing) throw new HttpError(404, "Médecin introuvable");
  await assertEmailAvailable(data.email, existing.userId);

  await db.transaction(async (tx) => {
    const userUpdate: Partial<typeof users.$inferInsert> = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
    };
    if (data.password) {
      if (data.password.length < 6) throw new HttpError(400, "Le mot de passe doit contenir au moins 6 caractères");
      userUpdate.passwordHash = await bcrypt.hash(data.password, 10);
    }
    await tx.update(users).set(userUpdate).where(eq(users.id, existing.userId));
    await tx
      .update(doctors)
      .set({ specialty: data.specialty ?? null, hospital: data.hospital ?? null })
      .where(eq(doctors.id, doctorId));
  });
  return (await findDoctor(doctorId))!;
}

// Supprime le compte du médecin ; ses patients restent, sans médecin attitré
export async function deleteDoctor(doctorId: number) {
  const existing = await db.query.doctors.findFirst({ where: eq(doctors.id, doctorId) });
  if (!existing) throw new HttpError(404, "Médecin introuvable");
  await db.delete(users).where(eq(users.id, existing.userId));
}
