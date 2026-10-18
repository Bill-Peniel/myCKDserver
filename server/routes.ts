import { Router, type Express } from "express";
import { createServer, type Server } from "http";
import { authenticate, requireRole, setupSession } from "./auth";
import authRouter from "./api/auth";
import userRouter from "./api/user";
import patientsRouter from "./api/patients";
import doctorsRouter from "./api/doctors";
import { labTestsRouter, labResultsRouter } from "./api/lab";
import appointmentsRouter from "./api/appointments";
import notificationsRouter from "./api/notifications";
import workflowsRouter from "./api/workflows";
import dashboardRouter from "./api/dashboard";
import chatbotRouter from "./api/chatbot";
import adminRouter from "./api/admin";

export async function registerRoutes(app: Express): Promise<Server> {
  setupSession(app);

  const api = Router();
  app.use("/api", api);

  // Routes publiques
  api.use("/auth", authRouter);

  // Toutes les routes suivantes exigent une authentification
  api.use(authenticate);
  api.use("/user", userRouter);
  api.use("/admin", adminRouter);
  api.use("/doctors", requireRole("medecin", "admin"), doctorsRouter);
  api.use("/lab-tests", labTestsRouter);
  api.use("/patients", patientsRouter);
  api.use("/patient-lab-results", labResultsRouter);
  api.use("/appointments", appointmentsRouter);
  api.use("/notifications", notificationsRouter);
  api.use("/workflows", workflowsRouter);
  api.use("/dashboard", dashboardRouter);
  api.use("/chatbot", requireRole("medecin", "admin"), chatbotRouter);

  api.use((_req, res) => {
    res.status(404).json({ message: "Route API introuvable" });
  });

  return createServer(app);
}
