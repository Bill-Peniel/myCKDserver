import bcrypt from "bcrypt";
import { eq, sql } from "drizzle-orm";
import { db } from "./db";
import { labTests, users, type InsertLabTest } from "../shared/schema";

// Catalogue des tests de laboratoire (repris de l'ancienne base MongoDB)
const LAB_TESTS: InsertLabTest[] = [
  {
    testName: "Créatinine sanguine",
    description: "Mesure de la fonction rénale",
    unit: "mg/dL",
    normalMin: 0.5,
    normalMax: 1.2,
    category: "Sanguin"
  },
  {
    testName: "DFG estimé",
    description: "Débit de filtration glomérulaire estimé",
    unit: "mL/min/1.73m²",
    normalMin: 90,
    normalMax: 120,
    category: "Sanguin"
  },
  {
    testName: "Urée sanguine",
    description: "Mesure de la fonction rénale",
    unit: "mg/dL",
    normalMin: 7,
    normalMax: 20,
    category: "Sanguin"
  },
  {
    testName: "Sodium",
    description: "Électrolyte sanguin",
    unit: "mmol/L",
    normalMin: 135,
    normalMax: 145,
    category: "Sanguin"
  },
  {
    testName: "Potassium",
    description: "Électrolyte sanguin",
    unit: "mmol/L",
    normalMin: 3.5,
    normalMax: 5.0,
    category: "Sanguin"
  },
  {
    testName: "Calcium",
    description: "Électrolyte sanguin",
    unit: "mmol/L",
    normalMin: 2.1,
    normalMax: 2.6,
    category: "Sanguin"
  },
  {
    testName: "Phosphore",
    description: "Minéral sanguin",
    unit: "mmol/L",
    normalMin: 0.8,
    normalMax: 1.5,
    category: "Sanguin"
  },
  {
    testName: "Magnésium",
    description: "Électrolyte sanguin",
    unit: "mmol/L",
    normalMin: 0.7,
    normalMax: 1.0,
    category: "Sanguin"
  },
  {
    testName: "Bicarbonates",
    description: "Équilibre acido-basique",
    unit: "mmol/L",
    normalMin: 22,
    normalMax: 30,
    category: "Sanguin"
  },
  {
    testName: "Chlore",
    description: "Électrolyte sanguin",
    unit: "mmol/L",
    normalMin: 98,
    normalMax: 106,
    category: "Sanguin"
  },
  {
    testName: "Protéines totales",
    description: "Protéines sanguines",
    unit: "g/L",
    normalMin: 60,
    normalMax: 80,
    category: "Sanguin"
  },
  {
    testName: "Albumine",
    description: "Protéine sanguine",
    unit: "g/L",
    normalMin: 35,
    normalMax: 50,
    category: "Sanguin"
  },
  {
    testName: "Parathormone",
    description: "Hormone parathyroïdienne",
    unit: "pg/mL",
    normalMin: 10,
    normalMax: 65,
    category: "Sanguin"
  },
  {
    testName: "Hémoglobine Homme",
    description: "Taux d'hémoglobine masculin",
    unit: "g/dL",
    normalMin: 13,
    normalMax: 17,
    category: "Sanguin"
  },
  {
    testName: "Hémoglobine Femme",
    description: "Taux d'hémoglobine féminin",
    unit: "g/dL",
    normalMin: 12,
    normalMax: 16,
    category: "Sanguin"
  },
  {
    testName: "Protéinurie",
    description: "Protéines dans les urines",
    unit: "mg/24h",
    normalMin: 0,
    normalMax: 150,
    category: "Urinaire"
  },
  {
    testName: "Albuminurie/créatininurie",
    description: "Rapport albumine/créatinine urinaire",
    unit: "mg/g",
    normalMin: 0,
    normalMax: 30,
    category: "Urinaire"
  },
  {
    testName: "Sodium urinaire",
    description: "Électrolyte urinaire",
    unit: "mmol/L",
    normalMin: 40,
    normalMax: 220,
    category: "Urinaire"
  },
  {
    testName: "Potassium urinaire",
    description: "Électrolyte urinaire",
    unit: "mmol/L",
    normalMin: 25,
    normalMax: 125,
    category: "Urinaire"
  },
  {
    testName: "Clairance de la créatinine",
    description: "Mesure de la fonction rénale",
    unit: "mL/min",
    normalMin: 90,
    normalMax: 120,
    category: "Spécialisé"
  },
  {
    testName: "Clairance de l'inuline",
    description: "Mesure précise du DFG",
    unit: "mL/min",
    normalMin: 100,
    normalMax: 120,
    category: "Spécialisé"
  }
];

export async function seedDatabase() {
  // Insère les tests manquants sans toucher à ceux qui existent déjà
  const inserted = await db.insert(labTests).values(LAB_TESTS).onConflictDoNothing({ target: labTests.testName }).returning();
  if (inserted.length) console.log(`🌱 ${inserted.length} test(s) de laboratoire ajouté(s)`);

  // Crée le compte administrateur initial s'il n'existe aucun admin
  const [{ admins }] = await db.select({ admins: sql<number>`count(*)::int` }).from(users).where(eq(users.role, "admin"));
  if (admins > 0) return;

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn("⚠️  Aucun administrateur : définissez ADMIN_EMAIL et ADMIN_PASSWORD pour en créer un au démarrage");
    return;
  }
  await db.insert(users).values({
    firstName: "Admin",
    lastName: "MRC",
    email,
    passwordHash: await bcrypt.hash(password, 10),
    role: "admin",
  }).onConflictDoNothing({ target: users.email });
  console.log(`🌱 Compte administrateur créé : ${email}`);
}
