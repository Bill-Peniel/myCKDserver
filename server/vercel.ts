// Point d'entrée de la fonction serverless Vercel (voir script/vercel-build.mjs).
// L'application Express est un gestionnaire (req, res) : Vercel l'appelle à chaque requête /api/*.
import { createApp } from "./app";

export default createApp();
