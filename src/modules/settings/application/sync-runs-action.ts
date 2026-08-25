"use server";

import { z } from "zod";
import type { ActionResult } from "@/shared/actions/result";
import { runAction } from "@/modules/identity/application/run-action";
import { parseInput } from "@/modules/crm/application/action-helpers";
import {
  listSyncRunHistory,
  type SyncRunView,
} from "@/modules/finance/infrastructure/sync-status-repository";

const listSchema = z.object({
  limit: z.number().int().min(1).max(200).default(50),
});

/** Historial de corridas de sincronización (settings:read — admin). */
export async function listSyncRuns(
  input: unknown = {},
): Promise<ActionResult<SyncRunView[]>> {
  const parsed = parseInput(listSchema, input);
  if (!parsed.ok) return parsed.result;
  return runAction("settings", "read", () =>
    listSyncRunHistory(parsed.data.limit),
  );
}
