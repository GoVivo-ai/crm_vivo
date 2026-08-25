import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next.js usa .env.local; drizzle-kit y el seed corren fuera de Next.
config({ path: [".env.local", ".env"] });

export default defineConfig({
  dialect: "postgresql",
  schema: [
    "./src/modules/*/schema.ts",
    "./src/shared/database/*.schema.ts",
  ],
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
