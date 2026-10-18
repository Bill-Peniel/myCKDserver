import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { CkdStage } from "../shared/schema";

// Transmet les erreurs des handlers async au gestionnaire d'erreurs Express
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function parseId(value: unknown, label = "ID"): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `${label} invalide`);
  }
  return id;
}

export function parseNumber(value: unknown): number {
  return typeof value === "string" ? parseFloat(value.replace(",", ".")) : Number(value);
}

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function ageFromBirthDate(birthDate: string | Date, now = new Date()): number {
  const birth = new Date(birthDate);
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// DFG selon la formule MDRD (créatinine en mg/dL), avec le coefficient
// ethnique 1.212 utilisé par l'application d'origine.
export function calculateMDRD(creatinine: number, age: number, isFemale: boolean): number {
  let dfg = 186 * Math.pow(creatinine, -1.154) * Math.pow(age, -0.203);
  if (isFemale) dfg *= 0.742;
  dfg *= 1.212;
  return Math.max(0, Math.min(200, Math.round(dfg)));
}

export function determineCKDStage(dfg: number): CkdStage {
  if (dfg >= 90) return "Stage 1";
  if (dfg >= 60) return "Stage 2";
  if (dfg >= 45) return "Stage 3A";
  if (dfg >= 30) return "Stage 3B";
  if (dfg >= 15) return "Stage 4";
  return "Stage 5";
}
