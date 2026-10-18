import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db, pool } from "./db";
import { doctors, type User } from "../shared/schema";

export type SessionUser = {
  id: number;
  email: string;
  role: User["role"];
  firstName: string;
  lastName: string;
};

declare module "express-session" {
  interface SessionData {
    user?: SessionUser;
  }
}

declare global {
  namespace Express {
    interface Request {
      authUser?: SessionUser;
    }
  }
}

function resolveSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET (ou JWT_SECRET) doit être défini en production");
  }
  console.warn("⚠️  SESSION_SECRET non défini : utilisation d'un secret de développement");
  return "dev-only-insecure-secret";
}

const SECRET = resolveSecret();

export function setupSession(app: Express) {
  const PgStore = connectPgSimple(session);
  app.set("trust proxy", 1);
  app.use(
    session({
      secret: SECRET,
      resave: false,
      saveUninitialized: false,
      // La table est créée par seed.ts : createTableIfMissing lit un fichier .sql du paquet,
      // absent une fois l'application empaquetée (Vercel).
      store: new PgStore({ pool, tableName: "user_sessions" }),
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000,
      },
    }),
  );
}

export function signToken(user: SessionUser): string {
  return jwt.sign(user, SECRET, { expiresIn: "24h" });
}

export function toSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

// Accepte la session (cookie) ou un jeton Bearer
export function authenticate(req: Request, res: Response, next: NextFunction) {
  if (req.session.user) {
    req.authUser = req.session.user;
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentification requise" });
  }

  try {
    const decoded = jwt.verify(authHeader.slice(7), SECRET) as SessionUser;
    req.authUser = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
    };
    next();
  } catch {
    return res.status(401).json({ message: "Jeton invalide ou expiré" });
  }
}

export function requireRole(...roles: User["role"][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.authUser || !roles.includes(req.authUser.role)) {
      return res.status(403).json({ message: "Accès non autorisé" });
    }
    next();
  };
}

// Charge le profil médecin de l'utilisateur connecté dans res.locals.doctor
export async function requireDoctor(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.authUser?.role !== "medecin") {
      return res.status(403).json({ message: "Accès réservé aux médecins" });
    }
    const doctor = await db.query.doctors.findFirst({ where: eq(doctors.userId, req.authUser.id) });
    if (!doctor) {
      return res.status(403).json({ message: "Médecin introuvable pour cet utilisateur" });
    }
    res.locals.doctor = doctor;
    next();
  } catch (error) {
    next(error);
  }
}
