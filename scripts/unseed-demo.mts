/**
 * db:unseed-demo — borra EXACTAMENTE lo sembrado por db:seed-demo usando
 * el manifest scripts/.demo-seed.json (ids insertados). Nunca truncate:
 * los datos reales conviven con los demo y no se tocan.
 */
import { config } from "dotenv";
config({ path: [".env.local", ".env"] });
import { existsSync, readFileSync, unlinkSync } from "fs";
import { neon } from "@neondatabase/serverless";

const MANIFEST = "scripts/.demo-seed.json";

/** Orden inverso de dependencias FK. */
const DELETE_ORDER = [
  "synced_campaign_metrics",
  "ad_accounts",
  "account_staffing",
  "expenses",
  "invoices",
  "bank_transactions",
  "bank_accounts",
  "leave_requests",
  "payroll_payments",
  "employees",
  "projects",
  "account_services",
  "services",
  "proposals",
  "activities",
  "deals",
  "contacts",
  "accounts",
];

async function main() {
  if (!existsSync(MANIFEST)) {
    console.log("No hay manifest de seed demo — nada que borrar.");
    return;
  }
  const manifest = JSON.parse(readFileSync(MANIFEST, "utf8")) as Record<
    string,
    string[]
  >;
  const sql = neon(process.env.DATABASE_URL!);

  const unknown = Object.keys(manifest).filter(
    (t) => !DELETE_ORDER.includes(t),
  );
  if (unknown.length) {
    throw new Error(`Tablas fuera del orden de borrado: ${unknown.join(", ")}`);
  }

  let total = 0;
  for (const table of DELETE_ORDER) {
    const ids = manifest[table];
    if (!ids?.length) continue;
    // Identificadores de tabla fijos de DELETE_ORDER (no input externo).
    const deleted = await sql.query(
      `delete from ${table} where id = any($1::uuid[]) returning id`,
      [ids],
    );
    total += deleted.length;
    console.log(`${table}: ${deleted.length}/${ids.length} borrados`);
  }
  unlinkSync(MANIFEST);
  console.log(`Unseed listo: ${total} registros demo eliminados.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
