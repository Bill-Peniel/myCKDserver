import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db } from './db';
import { seedDatabase } from './seed';
import { sql } from 'drizzle-orm';

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

// Test database connection before seeding
async function testDatabaseConnection() {
  try {
    console.log('🔌 Testing database connection...');
    await db.execute(sql`SELECT 1`);
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

testDatabaseConnection().then(async (connected) => {
  if (!connected) return;
  try {
    await seedDatabase();
  } catch (error) {
    console.error('❌ Error seeding database (avez-vous lancé "npm run db:push" ?):', error);
  }
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const isServerError = status >= 500;
    const message = isServerError && process.env.NODE_ENV === "production"
      ? "Erreur interne du serveur"
      : err.message || "Internal Server Error";

    // Le corps de la requête n'est pas journalisé : il peut contenir des mots de passe
    if (isServerError) {
      console.error('🔴 ERROR:');
      console.error('  Path:', req.method, req.path);
      console.error('  Status:', status);
      console.error('  Stack:', err.stack);
      console.error('  Time:', new Date().toISOString());
      console.error('----------------------------------------');
    }

    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV !== "production") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
const port = parseInt(process.env.PORT || "5000", 10);

  server.listen({
    port,
    host: "0.0.0.0",
    // reusePort n'est pas supporté sous Windows
    reusePort: process.platform !== "win32",
  }, () => {
    log(`serving on port ${port}`);
  });
})();
