// Démarrage en serveur classique (développement, Render, Replit…).
// Sur Vercel, c'est api/index.ts qui est utilisé à la place.
import { createServer } from "http";
import { createApp, initializeDatabase, log } from "./app";
import { setupVite, serveStatic } from "./vite";

(async () => {
  const app = createApp();
  const server = createServer(app);

  initializeDatabase();

  // Vite (dev) ou les fichiers construits (prod) sont branchés après les routes API,
  // pour que leur route « catch-all » n'intercepte pas l'API.
  if (process.env.NODE_ENV !== "production") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

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
