import { and, eq, sql } from "drizzle-orm";
import { db } from "@/shared/database/db";
import { accounts } from "@/modules/crm/schema";
import { accountServices, projects } from "@/modules/clients/schema";
import type { ProjectHealth } from "@/modules/clients/domain/types";

export async function countActiveClients(): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(accounts)
    .where(eq(accounts.status, "active"));
  return row?.count ?? 0;
}

/** MRR global: suma de fees mensuales activos, por moneda. */
export async function getMrrByCurrency(): Promise<Record<string, number>> {
  const rows = await db
    .select({
      currency: accountServices.currency,
      total: sql<string>`sum(${accountServices.monthlyFee})`,
    })
    .from(accountServices)
    .where(eq(accountServices.isActive, true))
    .groupBy(accountServices.currency);
  const result: Record<string, number> = {};
  for (const r of rows) result[r.currency] = Number(r.total ?? 0);
  return result;
}

/** Conteo de proyectos por semáforo, solo de cuentas activas. */
export async function countProjectsByHealth(): Promise<
  Record<ProjectHealth, number>
> {
  const rows = await db
    .select({
      health: projects.health,
      count: sql<number>`count(*)::int`,
    })
    .from(projects)
    .innerJoin(accounts, eq(projects.accountId, accounts.id))
    .where(and(eq(accounts.status, "active")))
    .groupBy(projects.health);
  const result: Record<ProjectHealth, number> = {
    green: 0,
    yellow: 0,
    red: 0,
    unknown: 0,
  };
  for (const r of rows) result[r.health] = r.count;
  return result;
}

export type AccountProjectHealth = {
  accountId: string;
  accountName: string;
  /** Peor salud entre los proyectos de la cuenta (sin contar unknown). */
  worstHealth: ProjectHealth;
};

/** Cuentas activas con la peor salud de sus proyectos. */
export async function listAccountsWorstHealth(): Promise<
  AccountProjectHealth[]
> {
  const rows = await db
    .select({
      accountId: accounts.id,
      accountName: accounts.name,
      worstHealth: sql<string>`coalesce(
        max(case ${projects.health}
          when 'red' then 3 when 'yellow' then 2 when 'green' then 1
          else null end), 0)`,
    })
    .from(accounts)
    .leftJoin(projects, eq(projects.accountId, accounts.id))
    .where(eq(accounts.status, "active"))
    .groupBy(accounts.id, accounts.name);
  const decode: Record<string, ProjectHealth> = {
    "3": "red",
    "2": "yellow",
    "1": "green",
    "0": "unknown",
  };
  return rows.map((r) => ({
    accountId: r.accountId,
    accountName: r.accountName,
    worstHealth: decode[String(r.worstHealth)] ?? "unknown",
  }));
}

export type AccountOptionWithMrr = {
  id: string;
  name: string;
  /** Fees mensuales activos por moneda (mismo cálculo que getAccount360). */
  mrrByCurrency: Record<string, number>;
};

/** Todas las cuentas (para selects) con su MRR activo por moneda. */
export async function listAccountsWithMrr(): Promise<AccountOptionWithMrr[]> {
  const rows = await db
    .select({
      id: accounts.id,
      name: accounts.name,
      currency: accountServices.currency,
      total: sql<string | null>`sum(${accountServices.monthlyFee}) filter (where ${accountServices.isActive})`,
    })
    .from(accounts)
    .leftJoin(accountServices, eq(accountServices.accountId, accounts.id))
    .groupBy(accounts.id, accounts.name, accountServices.currency)
    .orderBy(accounts.name);
  const byAccount = new Map<string, AccountOptionWithMrr>();
  for (const r of rows) {
    let option = byAccount.get(r.id);
    if (!option) {
      option = { id: r.id, name: r.name, mrrByCurrency: {} };
      byAccount.set(r.id, option);
    }
    if (r.currency && r.total && Number(r.total) > 0) {
      option.mrrByCurrency[r.currency] =
        (option.mrrByCurrency[r.currency] ?? 0) + Number(r.total);
    }
  }
  return [...byAccount.values()];
}
