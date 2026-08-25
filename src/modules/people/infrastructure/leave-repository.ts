import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/shared/database/db";
import { employees, leaveRequests } from "@/modules/people/schema";
import type { LeaveRequestView } from "@/modules/people/domain/types";
import type { LeaveRequestInput } from "@/modules/people/domain/validation";

type LeaveRow = typeof leaveRequests.$inferSelect;

import { countLeaveDays } from "@/modules/people/domain/leave-days";

function toView(row: LeaveRow, employeeName: string | null): LeaveRequestView {
  return {
    id: row.id,
    employeeId: row.employeeId,
    employeeName,
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
  };
}

function baseQuery() {
  return db
    .select({ leave: leaveRequests, employeeName: employees.fullName })
    .from(leaveRequests)
    .innerJoin(employees, eq(leaveRequests.employeeId, employees.id));
}

export async function listLeaveForEmployee(
  employeeId: string,
): Promise<LeaveRequestView[]> {
  const rows = await baseQuery()
    .where(eq(leaveRequests.employeeId, employeeId))
    .orderBy(desc(leaveRequests.createdAt));
  return rows.map((r) => toView(r.leave, r.employeeName));
}

export async function listAllLeave(): Promise<LeaveRequestView[]> {
  const rows = await baseQuery()
    .orderBy(desc(leaveRequests.createdAt))
    .limit(500);
  return rows.map((r) => toView(r.leave, r.employeeName));
}

export async function insertLeave(
  employeeId: string,
  requestedBy: string,
  input: LeaveRequestInput,
): Promise<LeaveRequestView> {
  const rows = await db
    .insert(leaveRequests)
    .values({
      employeeId,
      type: input.type,
      startDate: input.startDate,
      endDate: input.endDate,
      reason: input.reason ?? null,
      requestedBy,
    })
    .returning();
  return toView(rows[0], null);
}

export async function findLeaveById(id: string): Promise<LeaveRow | null> {
  const rows = await db
    .select()
    .from(leaveRequests)
    .where(eq(leaveRequests.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function decideLeave(
  id: string,
  status: "approved" | "rejected",
  decidedBy: string,
  decisionNote: string | null,
): Promise<LeaveRow | null> {
  const rows = await db
    .update(leaveRequests)
    .set({ status, decidedBy, decidedAt: new Date(), decisionNote })
    .where(and(eq(leaveRequests.id, id), eq(leaveRequests.status, "requested")))
    .returning();
  return rows[0] ?? null;
}

/** Días (hábiles CO) aprobados del año en curso. Aproximación aceptada
 * (QA): una ausencia que cruza el año cuenta completa en el año de su
 * fecha de inicio. El conteo usa la función única countLeaveDays. */
export async function approvedDaysThisYear(
  employeeId: string,
): Promise<number> {
  const rows = await db
    .select({
      startDate: leaveRequests.startDate,
      endDate: leaveRequests.endDate,
    })
    .from(leaveRequests)
    .where(
      and(
        eq(leaveRequests.employeeId, employeeId),
        eq(leaveRequests.status, "approved"),
        sql`extract(year from ${leaveRequests.startDate}) = extract(year from current_date)`,
      ),
    );
  return rows.reduce(
    (acc, r) => acc + countLeaveDays(r.startDate, r.endDate),
    0,
  );
}
