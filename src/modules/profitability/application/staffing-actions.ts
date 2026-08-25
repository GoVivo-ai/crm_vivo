"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DomainRuleError } from "@/shared/actions/errors";
import { actionError, type ActionResult } from "@/shared/actions/result";
import { runAction } from "@/modules/identity/application/run-action";
import { parseInput } from "@/modules/crm/application/action-helpers";
import type { StaffingAssignment } from "@/modules/profitability/domain/types";
import { staffingInputSchema } from "@/modules/profitability/domain/validation";
import * as repo from "@/modules/profitability/infrastructure/staffing-repository";

/** Asignaciones empleado↔cuenta (profitability:read). */
export async function listAccountStaffing(
  accountId?: string,
): Promise<ActionResult<StaffingAssignment[]>> {
  return runAction("profitability", "read", () =>
    repo.listStaffing(accountId ?? null),
  );
}

async function assertCapacity(
  input: z.infer<typeof staffingInputSchema>,
  excludeId?: string,
) {
  const existing = await repo.overlappingPercentForEmployee(
    input.alegraEmployeeId,
    input.validFrom ?? null,
    input.validTo ?? null,
    excludeId,
  );
  if (existing + input.dedicationPercent > 100) {
    throw new DomainRuleError(
      `La dedicación del empleado superaría el 100% en el periodo (ya tiene ${existing}% asignado en fechas solapadas)`,
    );
  }
}

/** Crea asignación (profitability:write — admin). Valida que la suma de
 * % del empleado en periodos solapados no supere 100. */
export async function createStaffing(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(staffingInputSchema, input);
  if (!parsed.ok) return parsed.result;
  return runAction("profitability", "write", async () => {
    await assertCapacity(parsed.data);
    const row = await repo.insertStaffing(parsed.data);
    revalidatePath("/profitability");
    return { id: row.id };
  });
}

export async function updateStaffing(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(staffingInputSchema, input);
  if (!parsed.ok) return parsed.result;
  const result = await runAction("profitability", "write", async () => {
    await assertCapacity(parsed.data, id);
    return repo.updateStaffing(id, parsed.data);
  });
  if (!result.ok) return result;
  if (!result.data) return actionError("Asignación no encontrada");
  revalidatePath("/profitability");
  return { ok: true, data: { id } };
}

export async function deleteStaffing(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  const result = await runAction("profitability", "write", () =>
    repo.deleteStaffing(id),
  );
  if (!result.ok) return result;
  if (!result.data) return actionError("Asignación no encontrada");
  revalidatePath("/profitability");
  return { ok: true, data: { id } };
}
