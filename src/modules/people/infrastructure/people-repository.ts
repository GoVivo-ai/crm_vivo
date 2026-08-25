import { asc, eq } from "drizzle-orm";
import { db } from "@/shared/database/db";
import { employees } from "@/modules/people/schema";
import type {
  EmployeeDetail,
  EmployeeDocument,
  TeamMember,
} from "@/modules/people/domain/types";
import type { EmployeeInput } from "@/modules/people/domain/validation";

export type EmployeeRow = typeof employees.$inferSelect;

/** Directorio SIN compensación ni PII (no expone salario ni cédula). */
export function toTeamMember(row: EmployeeRow): TeamMember {
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
    hiredAt: row.hiredAt,
    position: row.position,
    area: row.area,
    active: row.active,
    contractType: row.contractType,
    contractEndDate: row.contractEndDate,
    documents: (row.documents ?? []) as EmployeeDocument[],
    annualLeaveDays: row.annualLeaveDays,
    userId: row.userId,
  };
}

export function toDetail(row: EmployeeRow): EmployeeDetail {
  return {
    ...toTeamMember(row),
    identification: row.identification,
    notes: row.notes,
  };
}

export async function listEmployees(): Promise<TeamMember[]> {
  const rows = await db.select().from(employees).orderBy(asc(employees.fullName));
  return rows.map(toTeamMember);
}

export async function findEmployeeRow(id: string): Promise<EmployeeRow | null> {
  const rows = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function findEmployeeByUserId(
  userId: string,
): Promise<EmployeeRow | null> {
  const rows = await db
    .select()
    .from(employees)
    .where(eq(employees.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

function toRow(input: EmployeeInput) {
  return {
    fullName: input.fullName,
    identification: input.identification ?? null,
    email: input.email || null,
    phone: input.phone ?? null,
    hiredAt: input.hiredAt ?? null,
    position: input.position ?? null,
    area: input.area ?? null,
    active: input.active,
    contractType: input.contractType ?? null,
    contractEndDate: input.contractEndDate ?? null,
    documents: input.documents ?? [],
    annualLeaveDays: input.annualLeaveDays,
    userId: input.userId ?? null,
    notes: input.notes ?? null,
  };
}

export async function insertEmployee(input: EmployeeInput): Promise<EmployeeRow> {
  const rows = await db.insert(employees).values(toRow(input)).returning();
  return rows[0];
}

export async function updateEmployeeById(
  id: string,
  input: EmployeeInput,
): Promise<EmployeeRow | null> {
  const rows = await db
    .update(employees)
    .set({ ...toRow(input), updatedAt: new Date() })
    .where(eq(employees.id, id))
    .returning();
  return rows[0] ?? null;
}

/** SENSIBLE — solo se invoca tras guard people_compensation:write. */
export async function setBaseSalary(
  id: string,
  baseSalary: number | null,
): Promise<boolean> {
  const rows = await db
    .update(employees)
    .set({
      baseSalary: baseSalary === null ? null : String(baseSalary),
      updatedAt: new Date(),
    })
    .where(eq(employees.id, id))
    .returning({ id: employees.id });
  return rows.length > 0;
}
