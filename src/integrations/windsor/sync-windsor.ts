import { and, eq, sql } from "drizzle-orm";
import { db } from "@/shared/database/db";
import { adAccounts, syncedCampaignMetrics } from "@/modules/marketing/schema";
import { runSync, type SyncStats } from "@/integrations/shared/sync-run";
import { toReadableSyncError } from "@/integrations/shared/errors";
import { sleep, PACE_MS } from "@/integrations/shared/paced";
import { windsorGet } from "@/integrations/windsor/windsor-client";
import { mapMetricRow } from "@/integrations/windsor/mappers";
import {
  WINDSOR_CONNECTORS,
  type AdPlatform,
  type WindsorRow,
} from "@/integrations/windsor/types";

/** Ventana móvil: re-sincroniza los últimos 7 días (métricas retroactivas). */
const WINDOW_DAYS = 7;

function dateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - WINDOW_DAYS);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

/** Asegura la fila en ad_accounts y devuelve su id (cache en memoria por run). */
async function ensureAdAccount(
  cache: Map<string, string>,
  platform: AdPlatform,
  row: WindsorRow,
): Promise<string | null> {
  if (!row.account_id) return null;
  const key = `${platform}:${row.account_id}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const existing = await db
    .select({ id: adAccounts.id })
    .from(adAccounts)
    .where(
      and(
        eq(adAccounts.platform, platform),
        eq(adAccounts.externalAccountId, row.account_id),
      ),
    )
    .limit(1);

  let id = existing[0]?.id;
  if (!id) {
    const [created] = await db
      .insert(adAccounts)
      .values({
        platform,
        externalAccountId: row.account_id,
        name: row.account_name ?? row.account_id,
        accountCurrency: row.account_currency ?? "COP",
      })
      .returning({ id: adAccounts.id });
    id = created.id;
  }
  cache.set(key, id);
  return id;
}

async function syncConnector(
  cache: Map<string, string>,
  connector: (typeof WINDSOR_CONNECTORS)[number],
): Promise<number> {
  const { from, to } = dateRange();
  const rows = await windsorGet(connector.connector, connector.fields, from, to);

  let upserted = 0;
  // Lotes secuenciales: el volumen es bajo (campañas × 7 días).
  for (let i = 0; i < rows.length; i += 50) {
    const batch = [];
    for (const row of rows.slice(i, i + 50)) {
      const adAccountId = await ensureAdAccount(cache, connector.platform, row);
      const mapped = mapMetricRow(row, connector.platform, adAccountId);
      if (mapped) batch.push(mapped);
    }
    if (batch.length === 0) continue;
    await db
      .insert(syncedCampaignMetrics)
      .values(batch)
      .onConflictDoUpdate({
        target: [
          syncedCampaignMetrics.platform,
          syncedCampaignMetrics.campaignExternalId,
          syncedCampaignMetrics.metricDate,
        ],
        set: {
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
        },
      });
    upserted += batch.length;
  }
  return upserted;
}

/**
 * Sincroniza métricas de Meta y Google Ads vía Windsor.ai sobre una ventana
 * móvil de 7 días. Cada connector falla aislado: un error en google_ads no
 * bloquea las métricas de Meta (queda registrado en stats.errors).
 */
export async function syncWindsor(): Promise<{
  runId: string;
  stats: SyncStats;
}> {
  return runSync("windsor", async () => {
    const cache = new Map<string, string>();
    const upserted: Record<string, number> = {};
    const errors: Record<string, string> = {};

    for (const connector of WINDSOR_CONNECTORS) {
      try {
        upserted[connector.connector] = await syncConnector(cache, connector);
      } catch (error) {
        errors[connector.connector] = toReadableSyncError(error);
      }
      await sleep(PACE_MS);
    }

    if (Object.keys(upserted).length === 0) {
      throw new Error(`Todos los connectors fallaron: ${JSON.stringify(errors)}`);
    }
    return { upserted, errors, windowDays: WINDOW_DAYS };
  });
}
