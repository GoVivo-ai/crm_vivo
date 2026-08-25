"use server";

import { revalidatePath } from "next/cache";
import { DomainRuleError } from "@/shared/actions/errors";
import { actionError, type ActionResult } from "@/shared/actions/result";
import { can } from "@/modules/identity/domain/permissions";
import { getCurrentUser } from "@/modules/identity/application/get-current-user";
import { runAction } from "@/modules/identity/application/run-action";
import { parseInput } from "@/modules/crm/application/action-helpers";
import type {
  LeaveBalance,
  LeaveRequestView,
} from "@/modules/people/domain/types";
import {
  decideLeaveSchema,
  leaveRequestInputSchema,
} from "@/modules/people/domain/validation";
import { countLeaveDays } from "@/modules/people/domain/leave-days";
import { findEmployeeByUserId, findEmployeeRow } from "@/modules/people/infrastructure/people-repository";
import * as repo from "@/modules/people/infrastructure/leave-repository";

/** Empleado del usuario del guard; sin empleado vinculado no se
 * resuelven datos de ausencias de nadie (regla del Planeador). */
async function requireOwnEmployee() {
  const user = await getCurrentUser();
  if (!user) throw new DomainRuleError("Sesión no válida");
  const employee = await findEmployeeByUserId(user.id);
  if (!employee) {
    throw new DomainRuleError(
      "Tu usuario no está vinculado a un empleado; pídelo a un admin",
    );
  }
  return { user, employee };
}

/** Crea una solicitud de ausencia. El solicitante es SIEMPRE el usuario
 * del guard — el payload no acepta userId (anti-IDOR). */
export async function createLeaveRequest(
  input: unknown,
): Promise<ActionResult<LeaveRequestView>> {
  const parsed = parseInput(leaveRequestInputSchema, input);
  if (!parsed.ok) return parsed.result;
  return runAction("people_directory", "read", async () => {
    const { user, employee } = await requireOwnEmployee();
    const leave = await repo.insertLeave(employee.id, user.id, parsed.data);
    revalidatePath("/people");
    return leave;
  });
}

/** Solicitudes y saldo del propio usuario (cualquier rol activo). */
export async function getMyLeave(): Promise<
  ActionResult<{ requests: LeaveRequestView[]; balance: LeaveBalance }>
> {
  return runAction("people_directory", "read", async () => {
    const { employee } = await requireOwnEmployee();
    const [requests, approvedDaysThisYear] = await Promise.all([
      repo.listLeaveForEmployee(employee.id),
      repo.approvedDaysThisYear(employee.id),
    ]);
    return {
      requests,
      balance: {
        annualLeaveDays: employee.annualLeaveDays,
        approvedDaysThisYear,
        remainingDays: employee.annualLeaveDays - approvedDaysThisYear,
      },
    };
  });
}

/** Listado global — SOLO aprobadores (people_directory:write). */
export async function listAllLeaveRequests(): Promise<
  ActionResult<LeaveRequestView[]>
> {
  return runAction("people_directory", "write", () => repo.listAllLeave());
}

/** Aprueba/rechaza. Reglas: solo aprobadores; el aprobador debe ser
 * DISTINTO del solicitante — sin excepción por rol. */
export async function decideLeaveRequest(
  input: unknown,
): Promise<ActionResult<LeaveRequestView>> {
  const parsed = parseInput(decideLeaveSchema, input);
  if (!parsed.ok) return parsed.result;
  const { leaveRequestId, decision, decisionNote } = parsed.data;
  const result = await runAction("people_directory", "write", async (user) => {
    if (!can(user.role, "people_directory", "write")) {
      throw new DomainRuleError("Solo aprobadores"); // redundante con el guard
    }
    const leave = await repo.findLeaveById(leaveRequestId);
    if (!leave) throw new DomainRuleError("Solicitud no encontrada");
    if (leave.status !== "requested") {
      throw new DomainRuleError("La solicitud ya fue decidida");
    }
    if (leave.requestedBy === user.id) {
      throw new DomainRuleError(
        "No puedes aprobar o rechazar tu propia solicitud",
      );
    }
    return repo.decideLeave(
      leaveRequestId,
      decision,
      user.id,
      decisionNote ?? null,
    );
  });
  if (!result.ok) return result;
  if (!result.data) {
    return actionError("La solicitud ya fue decidida por otra persona");
  }
  revalidatePath("/people");
  const row = result.data;
  return {
    ok: true,
    data: {
      id: row.id,
      employeeId: row.employeeId,
      employeeName: null,
      type: row.type,
      startDate: row.startDate,
      endDate: row.endDate,
      days: countLeaveDays(row.startDate, row.endDate),
      reason: row.reason,
      status: row.status,
      requestedBy: row.requestedBy,
      decidedBy: row.decidedBy,
      decidedAt: row.decidedAt,
      decisionNote: row.decisionNote,
      createdAt: row.createdAt,
    },
  };
}

/** Saldo y solicitudes de un empleado ARBITRARIO — para la card del
 * expediente. Acceso: people_directory:write (aprobadores) O el propio
 * empleado (employeeId vinculado al user del guard). */
export async function getLeaveBalanceFor(
  employeeId: string,
): Promise<ActionResult<{ requests: LeaveRequestView[]; balance: LeaveBalance }>> {
  return runAction("people_directory", "read", async (user) => {
    const employee = await findEmployeeRow(employeeId);
    if (!employee) throw new DomainRuleError("Empleado no encontrado");
    const isApprover = can(user.role, "people_directory", "write");
    const isSelf = employee.userId === user.id;
    if (!isApprover && !isSelf) {
      throw new DomainRuleError("Sin permiso para ver estas ausencias");
    }
    const [requests, approvedDaysThisYear] = await Promise.all([
      repo.listLeaveForEmployee(employeeId),
      repo.approvedDaysThisYear(employeeId),
    ]);
    return {
      requests,
      balance: {
        annualLeaveDays: employee.annualLeaveDays,
        approvedDaysThisYear,
        remainingDays: employee.annualLeaveDays - approvedDaysThisYear,
      },
    };
  });
}
