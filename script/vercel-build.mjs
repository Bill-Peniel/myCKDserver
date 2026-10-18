// Build pour Vercel (Build Output API v3) : https://vercel.com/docs/build-output-api/v3
//   .vercel/output/static/             → frontend construit par Vite (servi par le CDN)
//   .vercel/output/functions/api.func/ → toute l'API Express dans une seule fonction Node
//   .vercel/output/config.json         → routage : /api/* vers la fonction, le reste vers l'application React
import { build as viteBuild } from "vite";
import { build as esbuild } from "esbuild";
import fs from "fs/promises";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, ".vercel", "output");
const funcDir = path.join(out, "functions", "api.func");

await fs.rm(out, { recursive: true, force: true });

// 1. Frontend
await viteBuild({ configFile: path.join(root, "vite.config.ts"), mode: "production" });
await fs.cp(path.join(root, "dist", "public"), path.join(out, "static"), { recursive: true });

// 2. API : un seul fichier CommonJS, dépendances incluses (pas de résolution de modules à l'exécution)
await esbuild({
  entryPoints: [path.join(root, "server", "vercel.ts")],
  outfile: path.join(funcDir, "index.cjs"),
  bundle: true,
  platform: "node",
  target: "node22",
  format: "cjs",
  sourcemap: "linked",
  // Module natif optionnel de pg, jamais utilisé ici
  external: ["pg-native"],
  define: { "process.env.NODE_ENV": '"production"' },
  // Vercel attend le gestionnaire comme export du module
  footer: { js: "module.exports = module.exports.default || module.exports;" },
  logLevel: "warning",
});

await fs.writeFile(
  path.join(funcDir, ".vc-config.json"),
  JSON.stringify({
    runtime: "nodejs22.x",
    handler: "index.cjs",
    launcherType: "Nodejs",
    shouldAddHelpers: false,
    maxDuration: 30,
  }, null, 2),
);

// 3. Routage
await fs.writeFile(
  path.join(out, "config.json"),
  JSON.stringify({
    version: 3,
    routes: [
      // L'API garde son chemin d'origine (/api/...) : Express la route normalement
      { src: "^/api(?:/.*)?$", dest: "/api" },
      // Fichiers statiques (JS, CSS, favicon…)
      { handle: "filesystem" },
      // Toutes les autres URL sont des routes de l'application React
      { src: "/(.*)", dest: "/index.html" },
    ],
  }, null, 2),
);

console.log("✅ Build Vercel prêt dans .vercel/output");
