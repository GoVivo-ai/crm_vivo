"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/shared/actions/result";
import { runAction } from "@/modules/identity/application/run-action";
import { parseInput } from "@/modules/crm/application/action-helpers";
import { clearCredentialsSchema } from "@/modules/settings/domain/validation";
import { runManualSync } from "@/integrations/shared/manual-operations";

/** "Sincronizar ahora" de settings/integrations. Reutiliza la lógica de
 * los crons (implementación de Integraciones); queda registrado en
 * sync_runs como cualquier corrida. */
export async function runSyncNow(
  input: unknown,
): Promise<ActionResult<{ ok: boolean; error: string | null }>> {
  const parsed = parseInput(clearCredentialsSchema, input);
  if (!parsed.ok) return parsed.result;
  return runAction("settings", "write", async () => {
    const result = await runManualSync(parsed.data.integration);
    revalidatePath("/settings");
    return result;
  });
}
