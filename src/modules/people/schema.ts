import {
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "@/modules/identity/schema";

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

/** Expediente editable del empleado (datos que no existen en Alegra). */
export const employeeProfiles = pgTable("employee_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  alegraEmployeeId: text("alegra_employee_id").notNull().unique(),
  /** Vínculo opcional al usuario de la app (por email, lo fija un admin). */
  userId: uuid("user_id").unique().references(() => users.id),
  position: text("position"),
  area: text("area"),
  contractType: text("contract_type"),
  contractEndDate: date("contract_end_date"),
  /** Metadatos de documentos: [{name, url, expiresAt?}]. */
  documents: jsonb("documents"),
  annualLeaveDays: integer("annual_leave_days").notNull().default(15),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const leaveTypeEnum = pgEnum("leave_type", [
  "vacation",
  "sick",
  "personal",
  "unpaid",
  "other",
]);

export const leaveStatusEnum = pgEnum("leave_status", [
  "requested",
  "approved",
  "rejected",
]);

/** Ausencias/vacaciones. Solicitante SIEMPRE del guard; el aprobador debe
 * ser distinto del solicitante (regla del Planeador, sin excepciones). */
export const leaveRequests = pgTable("leave_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeProfileId: uuid("employee_profile_id")
    .notNull()
    .references(() => employeeProfiles.id),
  type: leaveTypeEnum("type").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  reason: text("reason"),
  status: leaveStatusEnum("status").notNull().default("requested"),
  requestedBy: uuid("requested_by")
    .notNull()
    .references(() => users.id),
  decidedBy: uuid("decided_by").references(() => users.id),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  decisionNote: text("decision_note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
