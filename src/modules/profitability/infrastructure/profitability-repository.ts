import { and, eq, gte, isNotNull, lte, ne, sql } from "drizzle-orm";
import { db } from "@/shared/database/db";
import { accounts } from "@/modules/crm/schema";
import { invoices } from "@/modules/finance/schema";
import { employees } from "@/modules/people/schema";
import {
  adAccounts,
  syncedCampaignMetrics,
} from "@/modules/marketing/schema";

export type RevenueByAccount = {
  accountId: string;
  accountName: string;
  revenueCop: number;
};

/** Ingresos por cuenta en el rango, desde las facturas del ERP (COP con
 * TRM por factura). Solo facturas vinculadas a una cuenta CRM. */
export async function getRevenueByAccount(range: {
  from: string;
  to: string;
}): Promise<RevenueByAccount[]> {
  const rows = await db
    .select({
      accountId: accounts.id,
      accountName: accounts.name,
      revenueCop: sql<string>`coalesce(sum(${invoices.total} * coalesce(${invoices.exchangeRate}, 1)), 0)`,
    })
    .from(invoices)
    .innerJoin(accounts, eq(invoices.accountId, accounts.id))
    .where(
      and(
        ne(invoices.status, "void"),
        gte(invoices.issueDate, range.from),
        lte(invoices.issueDate, range.to),
      ),
    )
    .groupBy(accounts.id, accounts.name);
  return rows.map((r) => ({ ...r, revenueCop: Number(r.revenueCop) }));
}

/** Ingresos del periodo SIN cuenta CRM asignada (facturas solo con
 * clientName) — bucket simétrico al costo sin asignar. */
export async function getUnassignedRevenue(range: {
  from: string;
  to: string;
}): Promise<number> {
  const [row] = await db
    .select({
      total: sql<string>`coalesce(sum(${invoices.total} * coalesce(${invoices.exchangeRate}, 1)), 0)`,
    })
    .from(invoices)
    .where(
      and(
        sql`${invoices.accountId} is null`,
        ne(invoices.status, "void"),
        gte(invoices.issueDate, range.from),
        lte(invoices.issueDate, range.to),
      ),
    );
  return Number(row?.total ?? 0);
}

/** Empleados activos del directorio (informativo en el dashboard). */
export async function countActiveEmployees(): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(employees)
    .where(eq(employees.active, true));
  return row?.count ?? 0;
}

export type AdSpendByAccount = { accountId: string; adSpendCop: number };

/** Pauta por cuenta en el rango (informativa; solo cuentas en COP). */
export async function getAdSpendByAccount(range: {
  from: string;
  to: string;
}): Promise<AdSpendByAccount[]> {
  const rows = await db
    .select({
      accountId: adAccounts.accountId,
      adSpendCop: sql<string>`coalesce(sum(${syncedCampaignMetrics.spend}), 0)`,
    })
    .from(syncedCampaignMetrics)
    .innerJoin(
      adAccounts,
      eq(syncedCampaignMetrics.adAccountId, adAccounts.id),
    )
    .where(
      and(
        isNotNull(adAccounts.accountId),
        eq(adAccounts.accountCurrency, "COP"),
        gte(syncedCampaignMetrics.metricDate, range.from),
        lte(syncedCampaignMetrics.metricDate, range.to),
      ),
    )
    .groupBy(adAccounts.accountId);
  return rows
    .filter((r) => r.accountId !== null)
    .map((r) => ({
      accountId: r.accountId as string,
      adSpendCop: Number(r.adSpendCop),
    }));
}
