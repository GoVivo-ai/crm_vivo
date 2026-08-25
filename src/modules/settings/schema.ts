import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "@/modules/identity/schema";

export const integrationTypeEnum = pgEnum("integration_type", [
  "alegra",
  "meta_ads",
  "clickup",
]);

export const testStatusEnum = pgEnum("integration_test_status", [
  "ok",
  "failed",
]);

// Credenciales de integraciones gestionadas desde la app. El payload va
// cifrado AES-256-GCM (ver credentials-crypto); NUNCA se expone a la UI.
export const integrationCredentials = pgTable("integration_credentials", {
  id: uuid("id").primaryKey().defaultRandom(),
  integration: integrationTypeEnum("integration").notNull().unique(),
  payloadEncrypted: text("payload_encrypted").notNull(),
  configuredBy: uuid("configured_by").references(() => users.id),
  configuredAt: timestamp("configured_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastTestStatus: testStatusEnum("last_test_status"),
  lastTestAt: timestamp("last_test_at", { withTimezone: true }),
  lastTestError: text("last_test_error"),
});
