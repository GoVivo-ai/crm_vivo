import {
  boolean,
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
import { recordSourceEnum } from "@/shared/database/record-source.schema";

export const contractTypeEnum = pgEnum("contract_type", [
  "termino_fijo",
  "indefinido",
  "prestacion_servicios",
  "obra_labor",
]);

/**
 * Empleados — tabla propia del ERP (fusión del antiguo directorio
 * sincronizado + expediente). QBO Payroll no tiene API pública, así que
 * la fuente es manual (source queda por si otra fuente aparece).
 */
export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: recordSourceEnum("source").notNull().default("manual"),
  fullName: text("full_name").notNull(),
  /** PII: NO va al directorio general — solo expediente y compensación. */
  identification: text("identification"),
  email: text("email"),
  phone: text("phone"),
  hiredAt: date("hired_at"),
  position: text("position"),
  area: text("area"),
  active: boolean("active").notNull().default(true),
  /** SENSIBLE: solo se expone vía people_compensation. */
  baseSalary: numeric("base_salary", { precision: 14, scale: 2 }),
  baseSalaryCurrency: text("base_salary_currency").notNull().default("COP"),
  // --- Contractual (expediente restringido, people_directory:write) ---
  contractType: contractTypeEnum("contract_type"),
  contractEndDate: date("contract_end_date"),
  workSchedule: text("work_schedule"),
  eps: text("eps"),
  afp: text("afp"),
  arl: text("arl"),
  cajaCompensacion: text("caja_compensacion"),
  // --- Personal (expediente restringido; la EDAD se calcula, jamás se
  // almacena) ---
  birthDate: date("birth_date"),
  address: text("address"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  bloodType: text("blood_type"),
  // --- Dotación (expediente restringido) ---
  shirtSize: text("shirt_size"),
  pantsSize: text("pants_size"),
  shoeSize: text("shoe_size"),
  /** Metadatos de documentos: [{name, url, expiresAt?}]. */
  documents: jsonb("documents"),
  annualLeaveDays: integer("annual_leave_days").notNull().default(15),
  /** Vínculo opcional al usuario de la app (lo fija un admin). */
  userId: uuid("user_id").unique().references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Pagos de nómina por persona y periodo — registro manual (QBO Payroll
 * sin API). Fuente de la serie de costo de nómina y del costo por
 * empleado de F9. */
export const payrollPayments = pgTable("payroll_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: recordSourceEnum("source").notNull().default("manual"),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id),
  /** Periodo YYYY-MM al que corresponde el pago. */
  period: text("period").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  currencyCode: text("currency_code").notNull().default("COP"),
  exchangeRate: numeric("exchange_rate", { precision: 14, scale: 4 }),
  paidAt: date("paid_at").notNull(),
  notes: text("notes"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
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
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id),
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
