import { asc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/shared/database/db";
import { employeeProfiles, syncedEmployees } from "@/modules/people/schema";
import type {
  EmployeeCompensation,
  EmployeeDocument,
  TeamMember,
} from "@/modules/people/domain/types";
import type { EmployeeProfileInput } from "@/modules/people/domain/validation";

export type ProfileRow = typeof employeeProfiles.$inferSelect;

const fullName = (names: string | null, lastNames: string | null) =>
  [names, lastNames].filter(Boolean).join(" ") || "(sin nombre)";

/** Directorio SIN compensación: nunca selecciona salary/contract. */
export async function listTeamDirectory(): Promise<TeamMember[]> {
  const rows = await db
    .select({
      alegraEmployeeId: syncedEmployees.alegraEmployeeId,
      names: syncedEmployees.names,
      lastNames: syncedEmployees.lastNames,
      email: syncedEmployees.email,
      phone: syncedEmployees.phone,
      hiredAt: syncedEmployees.hiredAt,
      birthday: syncedEmployees.birthday,
      position: syncedEmployees.position,
      area: syncedEmployees.area,
      status: syncedEmployees.status,
      profile: employeeProfiles,
    })
    .from(syncedEmployees)
    .leftJoin(
      employeeProfiles,
      eq(employeeProfiles.alegraEmployeeId, syncedEmployees.alegraEmployeeId),
    )
    .where(isNotNull(syncedEmployees.names))
    .orderBy(asc(syncedEmployees.names));
  return rows.map((r) => ({
    alegraEmployeeId: r.alegraEmployeeId,
    fullName: fullName(r.names, r.lastNames),
    email: r.email,
    phone: r.phone,
    hiredAt: r.hiredAt,
    birthday: r.birthday
      ? {
          day: Number(r.birthday.slice(8, 10)),
          month: Number(r.birthday.slice(5, 7)),
        }
      : null,
    position: r.profile?.position ?? r.position,
    area: r.profile?.area ?? r.area,
    status: r.status,
    profile: r.profile
      ? {
          id: r.profile.id,
          userId: r.profile.userId,
          contractType: r.profile.contractType,
          contractEndDate: r.profile.contractEndDate,
          documents: (r.profile.documents ?? []) as EmployeeDocument[],
          annualLeaveDays: r.profile.annualLeaveDays,
        }
      : null,
  }));
}

export async function findCompensation(
  alegraEmployeeId: string,
): Promise<EmployeeCompensation | null> {
  const rows = await db
    .select()
    .from(syncedEmployees)
    .where(eq(syncedEmployees.alegraEmployeeId, alegraEmployeeId))
    .limit(1);
  const r = rows[0];
  if (!r) return null;
  return {
    alegraEmployeeId: r.alegraEmployeeId,
    fullName: fullName(r.names, r.lastNames),
    identification: r.identification,
    registeredSalary: r.salary === null ? null : Number(r.salary),
    contract: r.contract,
  };
}

export async function upsertProfile(
  input: EmployeeProfileInput,
): Promise<ProfileRow> {
  const values = {
    alegraEmployeeId: input.alegraEmployeeId,
    userId: input.userId ?? null,
    position: input.position ?? null,
    area: input.area ?? null,
    contractType: input.contractType ?? null,
    contractEndDate: input.contractEndDate ?? null,
    documents: input.documents ?? [],
    annualLeaveDays: input.annualLeaveDays,
    notes: input.notes ?? null,
  };
  const rows = await db
    .insert(employeeProfiles)
    .values(values)
    .onConflictDoUpdate({
      target: employeeProfiles.alegraEmployeeId,
      set: { ...values, updatedAt: new Date() },
    })
    .returning();
  return rows[0];
}

export async function findEmployeeIdentification(
  alegraEmployeeId: string,
): Promise<string | null> {
  const rows = await db
    .select({ identification: syncedEmployees.identification })
    .from(syncedEmployees)
    .where(eq(syncedEmployees.alegraEmployeeId, alegraEmployeeId))
    .limit(1);
  return rows[0]?.identification ?? null;
}

export async function findProfileByAlegraEmployeeId(
  alegraEmployeeId: string,
): Promise<ProfileRow | null> {
  const rows = await db
    .select()
    .from(employeeProfiles)
    .where(eq(employeeProfiles.alegraEmployeeId, alegraEmployeeId))
    .limit(1);
  return rows[0] ?? null;
}

export async function findProfileByUserId(
  userId: string,
): Promise<ProfileRow | null> {
  const rows = await db
    .select()
    .from(employeeProfiles)
    .where(eq(employeeProfiles.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}
