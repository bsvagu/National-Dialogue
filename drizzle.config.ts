import "dotenv/config";             // make sure .env is loaded
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Check your .env file");
}

export default defineConfig({
  schema: "./shared/schema.ts",     // your schema file
  out: "./migrations",              // where migration files will be written
  dialect: "postgresql",            // correct for pg
  dbCredentials: {
    url: process.env.DATABASE_URL!, // ensure string is not undefined
  },
});
