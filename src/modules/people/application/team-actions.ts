"use server";

import { revalidatePath } from "next/cache";
import { actionError, type ActionResult } from "@/shared/actions/result";
import { runAction } from "@/modules/identity/application/run-action";
import { parseInput } from "@/modules/crm/application/action-helpers";
import type {
  EmployeeCompensation,
  PayrollCostSeries,
  TeamMember,
} from "@/modules/people/domain/types";
import { employeeProfileInputSchema } from "@/modules/people/domain/validation";
import * as repo from "@/modules/people/infrastructure/people-repository";
import { getPayrollCostByMonth } from "@/modules/people/infrastructure/payroll-cost-repository";

/** Directorio del equipo (people_directory:read — todos los activos).
 * NUNCA incluye salario ni datos de compensación. */
export async function getTeamDirectory(): Promise<ActionResult<TeamMember[]>> {
  return runAction("people_directory", "read", () => repo.listTeamDirectory());
}

/** Expediente editable (people_directory:write — management/admin). */
export async function upsertEmployeeProfile(
  input: unknown,
): Promise<ActionResult<{ profileId: string }>> {
  const parsed = parseInput(employeeProfileInputSchema, input);
  if (!parsed.ok) return parsed.result;
  return runAction("people_directory", "write", async () => {
    const profile = await repo.upsertProfile(parsed.data);
    revalidatePath("/people");
    return { profileId: profile.id };
  });
}

/** Salario registrado en Alegra (people_compensation:read). El dato puede
 * estar desactualizado — la UI lo etiqueta "salario registrado en Alegra"
 * y jamás se usa para series de costo. */
export async function getEmployeeCompensation(
  alegraEmployeeId: string,
): Promise<ActionResult<EmployeeCompensation>> {
  const result = await runAction("people_compensation", "read", () =>
    repo.findCompensation(alegraEmployeeId),
  );
  if (!result.ok) return result;
  if (!result.data) return actionError("Empleado no encontrado");
  return result as ActionResult<EmployeeCompensation>;
}

/** Serie mensual de costo de nómina derivada de pagos categorizados
 * (people_compensation:read). label es OBLIGATORIA en la UI. */
export async function getPayrollCostSeries(
  months: number = 12,
): Promise<ActionResult<PayrollCostSeries>> {
  return runAction("people_compensation", "read", async () => ({
    label: "costo de nómina (desde pagos)" as const,
    points: await getPayrollCostByMonth(Math.min(Math.max(months, 1), 36)),
  }));
}
