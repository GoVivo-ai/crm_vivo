import {
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// RR.HH. (Fase 7 — parcial). synced_payrolls NO se crea aún: la API de
// payroll de Alegra devuelve 402 con el plan actual; el costo de nómina
// se deriva de synced_supplier_payments.categories (decisión pendiente
// del Planeador). employee_profiles y leave_requests llegan con los
// contratos de F7.

/** Empleados de Alegra (upsert por alegra_employee_id — ULID string). */
export const syncedEmployees = pgTable("synced_employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  alegraEmployeeId: text("alegra_employee_id").notNull().unique(),
  names: text("names"),
  lastNames: text("last_names"),
  identification: text("identification"),
  position: text("position"),
  area: text("area"),
  /** SENSIBLE: solo se expone vía people_compensation. */
  salary: numeric("salary", { precision: 14, scale: 2 }),
  status: text("status"),
  contract: jsonb("contract"),
  raw: jsonb("raw"),
  syncedAt: timestamp("synced_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
