import { Router, type Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import MemoryStore from "memorystore";
import { eq } from "drizzle-orm";
import { db } from "./db";
import {
  patients,
  doctors,
  appointments,
  labTests,
  // Ajoute ici les autres tables si besoin
} from "../shared/schema";

const MemoryStoreSession = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Session setup
  app.use(
    session({
      secret: process.env.JWT_SECRET || "your-secret-key",
      resave: false,
      saveUninitialized: false,
      store: new MemoryStoreSession({ checkPeriod: 86400000 }),
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );

  const apiRouter = Router();
  app.use("/api", apiRouter);

  // --- Patients CRUD ---
  apiRouter.get("/patients", async (req, res) => {
    const allPatients = await db.select().from(patients);
    res.json(allPatients);
  });

  apiRouter.get("/patients/:id", async (req, res) => {
    const id = Number(req.params.id);
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    if (!patient) return res.status(404).json({ error: "Not found" });
    res.json(patient);
  });

  apiRouter.post("/patients", async (req, res) => {
    const { name, age, email } = req.body;
    const [newPatient] = await db.insert(patients).values({ name, age, email }).returning();
    res.json(newPatient);
  });

  apiRouter.put("/patients/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { name, age, email } = req.body;
    const [updated] = await db.update(patients).set({ name, age, email }).where(eq(patients.id, id)).returning();
    res.json(updated);
  });

  apiRouter.delete("/patients/:id", async (req, res) => {
    const id = Number(req.params.id);
    await db.delete(patients).where(eq(patients.id, id));
    res.json({ success: true });
  });

  // --- Doctors CRUD ---
  apiRouter.get("/doctors", async (req, res) => {
    const allDoctors = await db.select().from(doctors);
    res.json(allDoctors);
  });

  apiRouter.get("/doctors/:id", async (req, res) => {
    const id = Number(req.params.id);
    const [doctor] = await db.select().from(doctors).where(eq(doctors.id, id));
    if (!doctor) return res.status(404).json({ error: "Not found" });
    res.json(doctor);
  });

  apiRouter.post("/doctors", async (req, res) => {
    const { name, specialty, email } = req.body;
    const [newDoctor] = await db.insert(doctors).values({ name, specialty, email }).returning();
    res.json(newDoctor);
  });

  apiRouter.put("/doctors/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { name, specialty, email } = req.body;
    const [updated] = await db.update(doctors).set({ name, specialty, email }).where(eq(doctors.id, id)).returning();
    res.json(updated);
  });

  apiRouter.delete("/doctors/:id", async (req, res) => {
    const id = Number(req.params.id);
    await db.delete(doctors).where(eq(doctors.id, id));
    res.json({ success: true });
  });

  // --- Appointments CRUD ---
  apiRouter.get("/appointments", async (req, res) => {
    const allAppointments = await db.select().from(appointments);
    res.json(allAppointments);
  });

  apiRouter.get("/appointments/:id", async (req, res) => {
    const id = Number(req.params.id);
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    if (!appointment) return res.status(404).json({ error: "Not found" });
    res.json(appointment);
  });

  apiRouter.post("/appointments", async (req, res) => {
    const { patientId, doctorId, date, status } = req.body;
    const [newAppointment] = await db.insert(appointments).values({ patientId, doctorId, date, status }).returning();
    res.json(newAppointment);
  });

  apiRouter.put("/appointments/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { patientId, doctorId, date, status } = req.body;
    const [updated] = await db.update(appointments).set({ patientId, doctorId, date, status }).where(eq(appointments.id, id)).returning();
    res.json(updated);
  });

  apiRouter.delete("/appointments/:id", async (req, res) => {
    const id = Number(req.params.id);
    await db.delete(appointments).where(eq(appointments.id, id));
    res.json({ success: true });
  });

  // --- LabTests CRUD ---
  apiRouter.get("/labtests", async (req, res) => {
    const allLabTests = await db.select().from(labTests);
    res.json(allLabTests);
  });

  apiRouter.get("/labtests/:id", async (req, res) => {
    const id = Number(req.params.id);
    const [labtest] = await db.select().from(labTests).where(eq(labTests.id, id));
    if (!labtest) return res.status(404).json({ error: "Not found" });
    res.json(labtest);
  });

  apiRouter.post("/labtests", async (req, res) => {
    const { testName, description, unit, normalMin, normalMax } = req.body;
    const [newLabTest] = await db.insert(labTests).values({ testName, description, unit, normalMin, normalMax }).returning();
    res.json(newLabTest);
  });

  apiRouter.put("/labtests/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { testName, description, unit, normalMin, normalMax } = req.body;
    const [updated] = await db.update(labTests).set({ testName, description, unit, normalMin, normalMax }).where(eq(labTests.id, id)).returning();
    res.json(updated);
  });

  apiRouter.delete("/labtests/:id", async (req, res) => {
    const id = Number(req.params.id);
    await db.delete(labTests).where(eq(labTests.id, id));
    res.json({ success: true });
  });

  // --- Ajoute ici les autres entités (notifications, workflows, etc.) sur le même modèle ---

  const httpServer = createServer(app);
  return httpServer;
}
