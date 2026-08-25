import { and, eq, gte, isNotNull, lte, sql } from "drizzle-orm";
import { db } from "@/shared/database/db";
import { accounts } from "@/modules/crm/schema";
import { syncedInvoices } from "@/modules/finance/schema";
import { syncedEmployees } from "@/modules/people/schema";
import {
  adAccounts,
  syncedCampaignMetrics,
} from "@/modules/marketing/schema";

export type RevenueByAccount = {
  accountId: string;
  accountName: string;
  revenueCop: number;
};

/** Ingresos por cuenta en el rango: synced_invoices (COP con TRM por
 * factura) unidas por alegra_client_id ↔ accounts.alegra_contact_id. */
export async function getRevenueByAccount(range: {
  from: string;
  to: string;
}): Promise<RevenueByAccount[]> {
  const rows = await db
    .select({
      accountId: accounts.id,
      accountName: accounts.name,
      revenueCop: sql<string>`coalesce(sum(${syncedInvoices.total} * coalesce(${syncedInvoices.exchangeRate}, 1)), 0)`,
    })
    .from(syncedInvoices)
    .innerJoin(
      accounts,
      eq(syncedInvoices.alegraClientId, accounts.alegraContactId),
    )
    .where(
      and(
        isNotNull(syncedInvoices.date),
        gte(syncedInvoices.date, range.from),
        lte(syncedInvoices.date, range.to),
      ),
    )
    .groupBy(accounts.id, accounts.name);
  return rows.map((r) => ({ ...r, revenueCop: Number(r.revenueCop) }));
}

/** Empleados activos (post-filtro fantasma): capacidad del prorrateo. */
export async function countActiveEmployees(): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(syncedEmployees)
    .where(
      and(
        isNotNull(syncedEmployees.names),
        // Activo REAL: contract.endDate null o futura (el status de
        // Alegra es poco fiable — hay "active" con contrato terminado).
        sql`coalesce((${syncedEmployees.contract}->>'endDate')::date >= current_date, true)`,
      ),
    );
  return row?.count ?? 0;
}

export type AdSpendByAccount = { accountId: string; adSpendCop: number };

/** Pauta por cuenta en el rango (informativa; solo cuentas con moneda
 * COP suman — el spend multi-moneda no se mezcla). */
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
