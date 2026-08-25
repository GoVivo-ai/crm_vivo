import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "@/shared/database/schema";

export type Database = NeonHttpDatabase<typeof schema>;

let instance: Database | undefined;

function getDb(): Database {
  if (!instance) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL no está definida");
    }
    instance = drizzle(neon(process.env.DATABASE_URL), { schema });
  }
  return instance;
}

// Lazy para no exigir DATABASE_URL en build-time (solo al ejecutar queries).
export const db: Database = new Proxy({} as Database, {
  get(_target, prop) {
    const real = getDb() as unknown as Record<string | symbol, unknown>;
    const value = real[prop];
    return typeof value === "function" ? value.bind(real) : value;
  },
});
