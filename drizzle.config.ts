import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Load .env.local first (Next.js standard for secrets), then .env
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Select connection URL: targets test branch when DB_ENV=test or falls back gracefully
const databaseUrl =
  process.env.DB_ENV === 'test' && process.env.DATABASE_URL_TEST
    ? process.env.DATABASE_URL_TEST
    : (process.env.DATABASE_URL || process.env.DATABASE_URL_TEST);

export default defineConfig({
  out: './drizzle',
  schema: './db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl!,
  },
});
