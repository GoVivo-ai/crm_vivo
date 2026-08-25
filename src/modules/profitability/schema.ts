import {
  date,
  integer,
  pgTable,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { accounts } from "@/modules/crm/schema";
import { employees } from "@/modules/people/schema";

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
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id),
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
