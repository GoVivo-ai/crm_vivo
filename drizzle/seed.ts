import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { pipelineStages } from "../src/modules/crm/schema";

const STAGES = [
  { name: "Lead", position: 1, probability: 10 },
  { name: "Contactado", position: 2, probability: 25 },
  { name: "Propuesta", position: 3, probability: 50 },
  { name: "Negociación", position: 4, probability: 75 },
  { name: "Ganado", position: 5, probability: 100, isWon: true },
  { name: "Perdido", position: 6, probability: 0, isLost: true },
];

async function seed() {
  const db = drizzle(neon(process.env.DATABASE_URL!));
  await db.insert(pipelineStages).values(STAGES).onConflictDoNothing();
  console.log(`Seed listo: ${STAGES.length} etapas de pipeline`);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
