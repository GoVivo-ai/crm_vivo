import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/shared/database/db";
import { employeeProfiles, leaveRequests } from "@/modules/people/schema";
import { syncedEmployees } from "@/modules/people/schema";
import type { LeaveRequestView } from "@/modules/people/domain/types";
import type { LeaveRequestInput } from "@/modules/people/domain/validation";

type LeaveRow = typeof leaveRequests.$inferSelect;

const dayCount = (start: string, end: string) =>
  Math.round(
    (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) /
      86_400_000,
  ) + 1;

function toView(row: LeaveRow, employeeName: string | null): LeaveRequestView {
  return {
    id: row.id,
    employeeProfileId: row.employeeProfileId,
    employeeName,
    type: row.type,
    startDate: row.startDate,
    endDate: row.endDate,
    days: dayCount(row.startDate, row.endDate),
    reason: row.reason,
    status: row.status,
    requestedBy: row.requestedBy,
    decidedBy: row.decidedBy,
    decidedAt: row.decidedAt,
    decisionNote: row.decisionNote,
    createdAt: row.createdAt,
  };
}

const employeeNameSql = sql<string | null>`concat_ws(' ', ${syncedEmployees.names}, ${syncedEmployees.lastNames})`;

function baseQuery() {
  return db
    .select({ leave: leaveRequests, employeeName: employeeNameSql })
    .from(leaveRequests)
    .innerJoin(
      employeeProfiles,
      eq(leaveRequests.employeeProfileId, employeeProfiles.id),
    )
    .leftJoin(
      syncedEmployees,
      eq(employeeProfiles.alegraEmployeeId, syncedEmployees.alegraEmployeeId),
    );
}

export async function listLeaveForProfile(
  employeeProfileId: string,
): Promise<LeaveRequestView[]> {
  const rows = await baseQuery()
    .where(eq(leaveRequests.employeeProfileId, employeeProfileId))
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
  employeeProfileId: string,
  requestedBy: string,
  input: LeaveRequestInput,
): Promise<LeaveRequestView> {
  const rows = await db
    .insert(leaveRequests)
    .values({
      employeeProfileId,
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

/** Días aprobados del año en curso para un perfil. Aproximación
 * aceptada (QA): una ausencia que cruza el año cuenta completa en el
 * año de su fecha de inicio. */
export async function approvedDaysThisYear(
  employeeProfileId: string,
): Promise<number> {
  const [row] = await db
    .select({
      days: sql<number>`coalesce(sum((${leaveRequests.endDate} - ${leaveRequests.startDate}) + 1), 0)::int`,
    })
    .from(leaveRequests)
    .where(
      and(
        eq(leaveRequests.employeeProfileId, employeeProfileId),
        eq(leaveRequests.status, "approved"),
        sql`extract(year from ${leaveRequests.startDate}) = extract(year from current_date)`,
      ),
    );
  return row?.days ?? 0;
}
