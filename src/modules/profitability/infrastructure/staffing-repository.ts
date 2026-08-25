import { and, asc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/shared/database/db";
import { accountStaffing } from "@/modules/profitability/schema";
import { accounts } from "@/modules/crm/schema";
import { syncedEmployees } from "@/modules/people/schema";
import type { StaffingAssignment } from "@/modules/profitability/domain/types";
import type { StaffingInput } from "@/modules/profitability/domain/validation";

const employeeName = sql<string | null>`concat_ws(' ', ${syncedEmployees.names}, ${syncedEmployees.lastNames})`;

export async function listStaffing(
  accountId?: string | null,
): Promise<StaffingAssignment[]> {
  const rows = await db
    .select({
      staffing: accountStaffing,
      accountName: accounts.name,
      employeeName,
    })
    .from(accountStaffing)
    .leftJoin(accounts, eq(accountStaffing.accountId, accounts.id))
    .leftJoin(
      syncedEmployees,
      eq(accountStaffing.alegraEmployeeId, syncedEmployees.alegraEmployeeId),
    )
    .where(accountId ? eq(accountStaffing.accountId, accountId) : undefined)
    .orderBy(asc(accounts.name));
  return rows.map((r) => ({
    id: r.staffing.id,
    accountId: r.staffing.accountId,
    accountName: r.accountName,
    alegraEmployeeId: r.staffing.alegraEmployeeId,
    employeeName: r.employeeName,
    dedicationPercent: r.staffing.dedicationPercent,
    validFrom: r.staffing.validFrom,
    validTo: r.staffing.validTo,
  }));
}

/** Suma de % del empleado en asignaciones que se solapan con el rango
 * dado (null = extremo abierto), excluyendo opcionalmente una fila. */
export async function overlappingPercentForEmployee(
  alegraEmployeeId: string,
  validFrom: string | null,
  validTo: string | null,
  excludeId?: string,
): Promise<number> {
  const conditions = [
    eq(accountStaffing.alegraEmployeeId, alegraEmployeeId),
    sql`coalesce(${accountStaffing.validFrom}, '-infinity'::date) <= coalesce(${validTo ?? null}::date, 'infinity'::date)`,
    sql`coalesce(${validFrom ?? null}::date, '-infinity'::date) <= coalesce(${accountStaffing.validTo}, 'infinity'::date)`,
  ];
  if (excludeId) conditions.push(ne(accountStaffing.id, excludeId));
  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${accountStaffing.dedicationPercent}), 0)::int`,
    })
    .from(accountStaffing)
    .where(and(...conditions));
  return row?.total ?? 0;
}

export async function insertStaffing(input: StaffingInput) {
  const rows = await db
    .insert(accountStaffing)
    .values({
      accountId: input.accountId,
      alegraEmployeeId: input.alegraEmployeeId,
      dedicationPercent: input.dedicationPercent,
      validFrom: input.validFrom ?? null,
      validTo: input.validTo ?? null,
    })
    .returning();
  return rows[0];
}

export async function updateStaffing(id: string, input: StaffingInput) {
  const rows = await db
    .update(accountStaffing)
    .set({
      accountId: input.accountId,
      alegraEmployeeId: input.alegraEmployeeId,
      dedicationPercent: input.dedicationPercent,
      validFrom: input.validFrom ?? null,
      validTo: input.validTo ?? null,
      updatedAt: new Date(),
    })
    .where(eq(accountStaffing.id, id))
    .returning();
  return rows[0] ?? null;
}

export async function deleteStaffing(id: string): Promise<boolean> {
  const rows = await db
    .delete(accountStaffing)
    .where(eq(accountStaffing.id, id))
    .returning({ id: accountStaffing.id });
  return rows.length > 0;
}

/** Asignaciones vigentes en algún punto del rango, para el prorrateo. */
export async function listStaffingOverlappingPeriod(range: {
  from: string;
  to: string;
}) {
  return db
    .select()
    .from(accountStaffing)
    .where(
      and(
        sql`coalesce(${accountStaffing.validFrom}, '-infinity'::date) <= ${range.to}::date`,
        sql`${range.from}::date <= coalesce(${accountStaffing.validTo}, 'infinity'::date)`,
      ),
    );
}
