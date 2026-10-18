import 'dotenv/config';
import type { Config } from 'drizzle-kit';

export default {
  schema: "./shared/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  dialect: "postgresql",
  // Table des sessions gérée par connect-pg-simple, hors du schéma Drizzle
  tablesFilter: ["!user_sessions"],
} satisfies Config;
