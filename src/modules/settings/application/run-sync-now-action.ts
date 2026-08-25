"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/shared/actions/result";
import { runAction } from "@/modules/identity/application/run-action";
import { parseInput } from "@/modules/crm/application/action-helpers";
import { z } from "zod";
import { integrationSchema } from "@/modules/settings/domain/validation";
import { runManualSync } from "@/integrations/shared/manual-operations";

const runSyncSchema = z.object({
  integration: integrationSchema,
  /** Solo aplica a alegra: 'core' (invoices/pagos/snapshots) o 'erp'
   * (bills/empleados/bancos). */
  scope: z.enum(["core", "erp"]).default("core"),
});

/** "Sincronizar ahora" de settings/integrations. Reutiliza la lógica de
 * los crons (implementación de Integraciones); queda registrado en
 * sync_runs como cualquier corrida. */
export async function runSyncNow(
  input: unknown,
): Promise<ActionResult<{ ok: boolean; error: string | null }>> {
  const parsed = parseInput(runSyncSchema, input);
  if (!parsed.ok) return parsed.result;
  return runAction("settings", "write", async () => {
    const result = await runManualSync(
      parsed.data.integration,
      parsed.data.scope,
    );
    revalidatePath("/settings");
    return result;
  });
}
