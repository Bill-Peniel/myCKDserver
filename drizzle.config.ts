import type { Config } from 'drizzle-kit';

export default {
  schema: "./shared/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  dialect: "postgresql",
} satisfies Config;
