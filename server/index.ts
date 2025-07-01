import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db } from './db';
import { patients, doctors } from '../shared/schema';
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
      if (capturedJsonResponse) {
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

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');
    await db.insert(doctors).values({ name: "Dr. House", specialty: "Nephrology", email: "house@hospital.com" });
    await db.insert(patients).values({ name: "John Doe", age: 45, email: "john@doe.com" });
    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    // Don't exit on seed error, just log it
  }
}

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

testDatabaseConnection().then((connected) => {
  if (connected) {
    seed();
  }
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    // Log détaillé de l'erreur
    console.error('\x1b[31m%s\x1b[0m', '🔴 ERROR:');
    console.error('  Path:', req.path);
    console.error('  Method:', req.method);
    console.error('  Status:', status);
    console.error('  Message:', message);
    console.error('  Stack:', err.stack);
    if (req.body) {
      console.error('  Body:', JSON.stringify(req.body, null, 2));
    }
    console.error('  Time:', new Date().toISOString());
    console.error('----------------------------------------');

    res.status(status).json({ 
      message,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "development") {
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
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
