"use server";

import { revalidatePath } from "next/cache";
import { DomainRuleError } from "@/shared/actions/errors";
import { actionError, type ActionResult } from "@/shared/actions/result";
import { runAction } from "@/modules/identity/application/run-action";
import { can } from "@/modules/identity/domain/permissions";
import { parseInput } from "@/modules/crm/application/action-helpers";
import type {
  EmployeeCompensation,
  EmployeeDetail,
  PayrollCostSeries,
  PayrollPayment,
  TeamMember,
} from "@/modules/people/domain/types";
import {
  employeeInputSchema,
  payrollPaymentInputSchema,
  setBaseSalarySchema,
} from "@/modules/people/domain/validation";
import * as repo from "@/modules/people/infrastructure/people-repository";
import * as payroll from "@/modules/people/infrastructure/payroll-repository";

/** Directorio del equipo (people_directory:read — todos los activos). */
export async function getTeamDirectory(): Promise<ActionResult<TeamMember[]>> {
  return runAction("people_directory", "read", () => repo.listEmployees());
}

/** Alta de empleado — registro manual (people_directory:write). */
export async function createEmployee(
  input: unknown,
): Promise<ActionResult<EmployeeDetail>> {
  const parsed = parseInput(employeeInputSchema, input);
  if (!parsed.ok) return parsed.result;
  return runAction("people_directory", "write", async () => {
    const row = await repo.insertEmployee(parsed.data);
    revalidatePath("/people");
    return repo.toDetail(row);
  });
}

export async function updateEmployee(
  id: string,
  input: unknown,
): Promise<ActionResult<EmployeeDetail>> {
  const parsed = parseInput(employeeInputSchema, input);
  if (!parsed.ok) return parsed.result;
  const result = await runAction("people_directory", "write", () =>
    repo.updateEmployeeById(id, parsed.data),
  );
  if (!result.ok) return result;
  if (!result.data) return actionError("Empleado no encontrado");
  revalidatePath("/people");
  return { ok: true, data: repo.toDetail(result.data) };
}

/** Expediente completo. Acceso: people_directory:write (management/
 * admin) O el PROPIO empleado (employee.userId === user.id) — el caso
 * self recibe el detalle SIN notas internas (notes: null), regla §14. */
export async function getEmployeeDetail(
  id: string,
): Promise<ActionResult<EmployeeDetail>> {
  return runAction("people_directory", "read", async (user) => {
    const row = await repo.findEmployeeRow(id);
    if (!row) throw new DomainRuleError("Empleado no encontrado");
    const isWriter = can(user.role, "people_directory", "write");
    const isSelf = row.userId === user.id;
    if (!isWriter && !isSelf) {
      throw new DomainRuleError("Sin permiso para ver este expediente");
    }
    const detail = repo.toDetail(row);
    return isWriter ? detail : { ...detail, notes: null };
  });
}

/** Compensación: salario base + historial de pagos. Acceso:
 * people_compensation:read O el PROPIO empleado (solo lectura — las
 * mutaciones siguen exigiendo people_compensation:write, sin self). */
export async function getEmployeeCompensation(
  employeeId: string,
): Promise<ActionResult<EmployeeCompensation>> {
  return runAction("people_directory", "read", async (user) => {
    const row = await repo.findEmployeeRow(employeeId);
    if (!row) throw new DomainRuleError("Empleado no encontrado");
    const canRead = can(user.role, "people_compensation", "read");
    const isSelf = row.userId === user.id;
    if (!canRead && !isSelf) {
      throw new DomainRuleError("Sin permiso para ver la compensación");
    }
    return {
      employeeId: row.id,
      fullName: row.fullName,
      identification: row.identification,
      baseSalary: row.baseSalary === null ? null : Number(row.baseSalary),
      baseSalaryCurrency: row.baseSalaryCurrency,
      payments: await payroll.listPaymentsForEmployee(employeeId),
    };
  });
}

/** Salario base de referencia (people_compensation:write). */
export async function setEmployeeBaseSalary(
  input: unknown,
): Promise<ActionResult<{ employeeId: string }>> {
  const parsed = parseInput(setBaseSalarySchema, input);
  if (!parsed.ok) return parsed.result;
  const result = await runAction("people_compensation", "write", () =>
    repo.setBaseSalary(
      parsed.data.employeeId,
      parsed.data.baseSalary,
      parsed.data.currency,
    ),
  );
  if (!result.ok) return result;
  if (!result.data) return actionError("Empleado no encontrado");
  revalidatePath("/people");
  return { ok: true, data: { employeeId: parsed.data.employeeId } };
}

/** Registro de pago de nómina (people_compensation:write). */
export async function createPayrollPayment(
  input: unknown,
): Promise<ActionResult<PayrollPayment>> {
  const parsed = parseInput(payrollPaymentInputSchema, input);
  if (!parsed.ok) return parsed.result;
  return runAction("people_compensation", "write", async (user) => {
    const employee = await repo.findEmployeeRow(parsed.data.employeeId);
    if (!employee) throw new DomainRuleError("Empleado no encontrado");
    const payment = await payroll.insertPayment(parsed.data, user.id);
    revalidatePath("/people");
    return payment;
  });
}

export async function deletePayrollPayment(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  const result = await runAction("people_compensation", "write", () =>
    payroll.deletePaymentById(id),
  );
  if (!result.ok) return result;
  if (!result.data) return actionError("Pago no encontrado");
  revalidatePath("/people");
  return { ok: true, data: { id } };
}

/** Pagos recientes de nómina (people_compensation:read). */
export async function listRecentPayrollPayments(): Promise<
  ActionResult<PayrollPayment[]>
> {
  return runAction("people_compensation", "read", () =>
    payroll.listRecentPayments(50),
  );
}

/** Serie mensual de costo de nómina desde pagos registrados. */
export async function getPayrollCostSeries(
  months: number = 12,
): Promise<ActionResult<PayrollCostSeries>> {
  return runAction("people_compensation", "read", async () => ({
    label: "nómina (pagos registrados)" as const,
    points: await payroll.getPayrollCostByMonth(
      Math.min(Math.max(months, 1), 36),
    ),
  }));
}
