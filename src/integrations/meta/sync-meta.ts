import { and, eq, sql } from "drizzle-orm";
import { db } from "@/shared/database/db";
import { adAccounts, syncedCampaignMetrics } from "@/modules/marketing/schema";
import { runSync, type SyncStats } from "@/integrations/shared/sync-run";
import { toReadableSyncError } from "@/integrations/shared/errors";
import { PACE_MS, sleep } from "@/integrations/shared/paced";
import {
  fetchAdAccounts,
  fetchCampaignInsights,
} from "@/integrations/meta/meta-client";
import { mapInsight } from "@/integrations/meta/mappers";
import type { MetaAdAccount } from "@/integrations/meta/types";

/** Ventana móvil: Meta atribuye retroactivamente; 7 días re-sincronizados. */
const WINDOW_DAYS = 7;

function dateRange(): { since: string; until: string } {
  const until = new Date();
  const since = new Date();
  since.setDate(since.getDate() - WINDOW_DAYS);
  return {
    since: since.toISOString().slice(0, 10),
    until: until.toISOString().slice(0, 10),
  };
}

/** Alta/actualización de la cuenta y retorno de su uuid local. */
async function ensureAdAccount(account: MetaAdAccount): Promise<string> {
  const existing = await db
    .select({ id: adAccounts.id })
    .from(adAccounts)
    .where(
      and(
        eq(adAccounts.platform, "meta"),
        eq(adAccounts.externalAccountId, account.account_id),
      ),
    )
    .limit(1);
  if (existing[0]) return existing[0].id;

  const [created] = await db
    .insert(adAccounts)
    .values({
      platform: "meta",
      externalAccountId: account.account_id,
      name: account.name,
      accountCurrency: account.currency ?? "COP",
    })
    .returning({ id: adAccounts.id });
  return created.id;
}

const metricUpdateCols = {
  adAccountId: sql`excluded.ad_account_id`,
  campaignName: sql`excluded.campaign_name`,
  spend: sql`excluded.spend`,
  clicks: sql`excluded.clicks`,
  impressions: sql`excluded.impressions`,
  cpc: sql`excluded.cpc`,
  cpm: sql`excluded.cpm`,
  ctr: sql`excluded.ctr`,
  reach: sql`excluded.reach`,
  frequency: sql`excluded.frequency`,
  leads: sql`excluded.leads`,
  costPerLead: sql`excluded.cost_per_lead`,
  purchases: sql`excluded.purchases`,
  purchaseValue: sql`excluded.purchase_value`,
  roas: sql`excluded.roas`,
  raw: sql`excluded.raw`,
  syncedAt: sql`excluded.synced_at`,
};

/**
 * Sync directo con la Meta Marketing API: descubre las ad accounts del
 * token (alta automática en ad_accounts) y upsertea insights campaña × día
 * de la ventana móvil por (platform, campaign_external_id, metric_date).
 * Una cuenta que falla no bloquea las demás (stats.errors).
 */
export async function syncMeta(): Promise<{
  runId: string;
  stats: SyncStats;
}> {
  return runSync("meta_ads", async () => {
    const { since, until } = dateRange();
    const accounts = await fetchAdAccounts();
    const upserted: Record<string, number> = {};
    const errors: Record<string, string> = {};

    for (const account of accounts) {
      try {
        const adAccountId = await ensureAdAccount(account);
        const rows = await fetchCampaignInsights(
          account.account_id,
          since,
          until,
        );
        const mapped = rows
          .map((row) => mapInsight(row, adAccountId))
          .filter((row) => row !== null);
        for (let i = 0; i < mapped.length; i += 100) {
          await db
            .insert(syncedCampaignMetrics)
            .values(mapped.slice(i, i + 100))
            .onConflictDoUpdate({
              target: [
                syncedCampaignMetrics.platform,
                syncedCampaignMetrics.campaignExternalId,
                syncedCampaignMetrics.metricDate,
              ],
              set: metricUpdateCols,
            });
        }
        upserted[account.account_id] = mapped.length;
      } catch (error) {
        errors[account.account_id] = toReadableSyncError(error);
      }
      await sleep(PACE_MS);
    }

    if (accounts.length > 0 && Object.keys(upserted).length === 0) {
      throw new Error(
        `Todas las cuentas fallaron: ${JSON.stringify(errors)}`,
      );
    }
    return { accounts: accounts.length, upserted, errors, windowDays: WINDOW_DAYS };
  });
}
