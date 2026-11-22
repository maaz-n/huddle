import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "./schema";

const connectionString =
  process.env.NODE_ENV === "test" && process.env.DATABASE_URL_TEST
    ? process.env.DATABASE_URL_TEST
    : (process.env.DATABASE_URL || process.env.DATABASE_URL_TEST);

export const db = drizzle(connectionString!, { schema });

