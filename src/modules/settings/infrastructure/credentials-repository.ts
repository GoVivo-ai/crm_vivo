import { eq } from "drizzle-orm";
import { db } from "@/shared/database/db";
import { integrationCredentials } from "@/modules/settings/schema";
import type { Integration } from "@/modules/settings/domain/types";

export type CredentialsRow = typeof integrationCredentials.$inferSelect;

export async function findCredentialsRow(
  integration: Integration,
): Promise<CredentialsRow | null> {
  const rows = await db
    .select()
    .from(integrationCredentials)
    .where(eq(integrationCredentials.integration, integration))
    .limit(1);
  return rows[0] ?? null;
}

export async function listCredentialsRows(): Promise<CredentialsRow[]> {
  return db.select().from(integrationCredentials);
}

export async function upsertCredentials(
  integration: Integration,
  payloadEncrypted: string,
  configuredBy: string,
): Promise<void> {
  await db
    .insert(integrationCredentials)
    .values({ integration, payloadEncrypted, configuredBy })
    .onConflictDoUpdate({
      target: integrationCredentials.integration,
      set: {
        payloadEncrypted,
        configuredBy,
        configuredAt: new Date(),
        // Credenciales nuevas: el último test ya no aplica.
        lastTestStatus: null,
        lastTestAt: null,
        lastTestError: null,
      },
    });
}

export async function recordTestResult(
  integration: Integration,
  ok: boolean,
  error: string | null,
): Promise<void> {
  await db
    .update(integrationCredentials)
    .set({
      lastTestStatus: ok ? "ok" : "failed",
      lastTestAt: new Date(),
      lastTestError: error,
    })
    .where(eq(integrationCredentials.integration, integration));
}

export async function deleteCredentials(
  integration: Integration,
): Promise<boolean> {
  const rows = await db
    .delete(integrationCredentials)
    .where(eq(integrationCredentials.integration, integration))
    .returning({ id: integrationCredentials.id });
  return rows.length > 0;
}
