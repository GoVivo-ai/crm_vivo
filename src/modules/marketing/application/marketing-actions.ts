"use server";

import { revalidatePath } from "next/cache";
import { actionError, type ActionResult } from "@/shared/actions/result";
import { runAction } from "@/modules/identity/application/run-action";
import { parseInput } from "@/modules/crm/application/action-helpers";
import type {
  AdAccountView,
  MarketingDashboard,
} from "@/modules/marketing/domain/types";
import {
  adAccountLinkSchema,
  marketingPeriodSchema,
} from "@/modules/marketing/domain/validation";
import {
  computeRates,
  sumTotals,
} from "@/modules/marketing/domain/metrics";
import * as repo from "@/modules/marketing/infrastructure/marketing-repository";

const DAY_MS = 86_400_000;
const isoDate = (d: Date) => d.toISOString().slice(0, 10);

/** Rango pedido (default: últimos 30 días) + periodo anterior contiguo. */
function resolvePeriods(from?: string | null, to?: string | null) {
  const toDate = to ? new Date(`${to}T00:00:00Z`) : new Date();
  const fromDate = from
    ? new Date(`${from}T00:00:00Z`)
    : new Date(toDate.getTime() - 29 * DAY_MS);
  const lengthDays =
    Math.round((toDate.getTime() - fromDate.getTime()) / DAY_MS) + 1;
  const prevTo = new Date(fromDate.getTime() - DAY_MS);
  const prevFrom = new Date(prevTo.getTime() - (lengthDays - 1) * DAY_MS);
  return {
    period: { from: isoDate(fromDate), to: isoDate(toDate) },
    previousPeriod: { from: isoDate(prevFrom), to: isoDate(prevTo) },
  };
}

/**
 * Dashboard de Ads (marketing:read). Spend en la moneda de cada cuenta
 * publicitaria, sin convertir. Con accountId filtra por cliente vinculado.
 */
export async function getMarketingDashboard(
  input: unknown = {},
): Promise<ActionResult<MarketingDashboard>> {
  const parsed = parseInput(marketingPeriodSchema, input);
  if (!parsed.ok) return parsed.result;
  const { accountId, from, to } = parsed.data;
  const { period, previousPeriod } = resolvePeriods(from, to);

  return runAction("marketing", "read", async () => {
    const [byPlatformRaw, previousRaw, byCampaignRaw] = await Promise.all([
      repo.aggregateByPlatform(period, accountId),
      repo.aggregateByPlatform(previousPeriod, accountId),
      repo.aggregateByCampaign(period, accountId),
    ]);
    return {
      period,
      previousPeriod,
      totals: sumTotals(byPlatformRaw),
      previousTotals: sumTotals(previousRaw),
      byPlatform: byPlatformRaw.map((g) => ({
        platform: g.platform,
        ...computeRates(g),
      })),
      byCampaign: byCampaignRaw.map((g) => ({
        platform: g.platform,
        campaignExternalId: g.campaignExternalId,
        campaignName: g.campaignName,
        adAccountName: g.adAccountName,
        ...computeRates(g),
      })),
    };
  });
}

/** Cuentas publicitarias con su cliente vinculado (o null = pendiente). */
export async function getAdAccounts(): Promise<ActionResult<AdAccountView[]>> {
  return runAction("marketing", "read", () => repo.listAdAccountViews());
}

/** Vincula (o desvincula con accountId null) una cuenta publicitaria a un
 * cliente CRM. Permiso: marketing write (operations/admin). */
export async function setAdAccountLink(
  input: unknown,
): Promise<ActionResult<{ adAccountId: string }>> {
  const parsed = parseInput(adAccountLinkSchema, input);
  if (!parsed.ok) return parsed.result;
  const { adAccountId, accountId } = parsed.data;
  const result = await runAction("marketing", "write", () =>
    repo.updateAdAccountLink(adAccountId, accountId),
  );
  if (!result.ok) return result;
  if (!result.data) return actionError("Cuenta publicitaria no encontrada");
  revalidatePath("/marketing");
  return { ok: true, data: { adAccountId } };
}
