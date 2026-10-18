import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { sql } from "drizzle-orm";
import { registerRoutes } from "./routes";
import { db } from "./db";
import { seedDatabase } from "./seed";

// Ce module ne doit pas importer ./vite : il est aussi chargé par la fonction serverless
// Vercel (api/index.ts), où Vite (dépendance de développement) n'est pas disponible.

export function log(message: string, source = "express") {
  const time = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  console.log(`${time} [${source}] ${message}`);
}

let initialization: Promise<void> | undefined;

/** Vérifie la connexion et initialise la base (une seule fois par processus / instance) */
export function initializeDatabase(): Promise<void> {
  initialization ??= (async () => {
    try {
      await db.execute(sql`SELECT 1`);
      log("Connexion à la base de données réussie", "db");
    } catch (error) {
      console.error("❌ Connexion à la base de données impossible :", error);
      return;
    }
    try {
      await seedDatabase();
    } catch (error) {
      console.error('❌ Initialisation de la base impossible (avez-vous lancé "npm run db:push" ?) :', error);
    }
  })();
  return initialization;
}

/** Construit l'application Express (API uniquement, sans servir le frontend) */
export function createApp(): Express {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        // Pas de corps pour /api/auth : il contient le jeton de session
        if (capturedJsonResponse && !path.startsWith("/api/auth")) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }

        log(logLine);
      }
    });

    next();
  });

  // La base est initialisée avant de traiter la première requête API
  app.use("/api", (_req, _res, next) => {
    initializeDatabase().then(() => next(), next);
  });

  registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const isServerError = status >= 500;
    const message = isServerError && process.env.NODE_ENV === "production"
      ? "Erreur interne du serveur"
      : err.message || "Internal Server Error";

    // Le corps de la requête n'est pas journalisé : il peut contenir des mots de passe
    if (isServerError) {
      console.error("🔴 ERROR:");
      console.error("  Path:", req.method, req.path);
      console.error("  Status:", status);
      console.error("  Stack:", err.stack);
      console.error("  Time:", new Date().toISOString());
      console.error("----------------------------------------");
    }

    res.status(status).json({ message });
  });

  return app;
}
