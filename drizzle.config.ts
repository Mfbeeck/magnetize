import { config } from 'dotenv';
import { defineConfig } from "drizzle-kit";

// Load environment variables
config();

if (!process.env.SUPA_PWD) {
  throw new Error("SUPA_PWD environment variable is required");
}

const connectionString = `postgresql://postgres.kbrieyaleukoqavqcslc:${process.env.SUPA_PWD}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`;

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
