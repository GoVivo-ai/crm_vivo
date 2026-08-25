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
import { findProfileByUserId } from "@/modules/people/infrastructure/people-repository";
import * as repo from "@/modules/people/infrastructure/leave-repository";

/** Perfil del usuario del guard; sin employee_profile vinculado no se
 * resuelven datos de ausencias de nadie (regla del Planeador). */
async function requireOwnProfile() {
  const user = await getCurrentUser();
  if (!user) throw new DomainRuleError("Sesión no válida");
  const profile = await findProfileByUserId(user.id);
  if (!profile) {
    throw new DomainRuleError(
      "Tu usuario no está vinculado a un expediente de empleado; pídelo a un admin",
    );
  }
  return { user, profile };
}

/** Crea una solicitud de ausencia. El solicitante es SIEMPRE el usuario
 * del guard — el payload no acepta userId (anti-IDOR). */
export async function createLeaveRequest(
  input: unknown,
): Promise<ActionResult<LeaveRequestView>> {
  const parsed = parseInput(leaveRequestInputSchema, input);
  if (!parsed.ok) return parsed.result;
  return runAction("people_directory", "read", async () => {
    const { user, profile } = await requireOwnProfile();
    const leave = await repo.insertLeave(profile.id, user.id, parsed.data);
    revalidatePath("/people");
    return leave;
  });
}

/** Solicitudes y saldo del propio usuario (cualquier rol activo). */
export async function getMyLeave(): Promise<
  ActionResult<{ requests: LeaveRequestView[]; balance: LeaveBalance }>
> {
  return runAction("people_directory", "read", async () => {
    const { profile } = await requireOwnProfile();
    const [requests, approvedDaysThisYear] = await Promise.all([
      repo.listLeaveForProfile(profile.id),
      repo.approvedDaysThisYear(profile.id),
    ]);
    return {
      requests,
      balance: {
        annualLeaveDays: profile.annualLeaveDays,
        approvedDaysThisYear,
        remainingDays: profile.annualLeaveDays - approvedDaysThisYear,
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
      employeeProfileId: row.employeeProfileId,
      employeeName: null,
      type: row.type,
      startDate: row.startDate,
      endDate: row.endDate,
      days:
        Math.round(
          (Date.parse(row.endDate) - Date.parse(row.startDate)) / 86_400_000,
        ) + 1,
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
