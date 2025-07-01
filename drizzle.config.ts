// MongoDB is used instead of PostgreSQL

export default {
  schema: "./shared/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  dialect: "postgresql",
};
