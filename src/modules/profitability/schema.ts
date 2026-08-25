import {
  date,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { accounts } from "@/modules/crm/schema";

/**
 * Asignación empleado↔cuenta con % de dedicación y vigencia — el dato
 * diferenciador del ERP: no existe en ningún sistema externo, se edita
 * en la UI. La regla "suma de % por empleado ≤ 100 en periodos
 * solapados" se valida en application (staffing-actions).
 */
export const accountStaffing = pgTable("account_staffing", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => accounts.id),
  /** FK lógica a synced_employees.alegra_employee_id (ULID). */
  alegraEmployeeId: text("alegra_employee_id").notNull(),
  dedicationPercent: integer("dedication_percent").notNull(),
  /** Vigencia; null = abierta por ese extremo. */
  validFrom: date("valid_from"),
  validTo: date("valid_to"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
