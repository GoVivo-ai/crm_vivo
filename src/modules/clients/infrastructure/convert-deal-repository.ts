import { and, eq, gte, inArray, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { db } from "@/shared/database/db";
import { accounts, deals } from "@/modules/crm/schema";
import { accountServices, services } from "@/modules/clients/schema";
import type { Deal } from "@/modules/crm/domain/types";
import type { AccountService } from "@/modules/clients/domain/types";
import { toDeal } from "@/modules/crm/infrastructure/mappers";

export async function findExistingServiceIds(
  serviceIds: string[],
): Promise<string[]> {
  if (serviceIds.length === 0) return [];
  const rows = await db
    .select({ id: services.id })
    .from(services)
    .where(inArray(services.id, serviceIds));
  return rows.map((r) => r.id);
}

type ServiceToContract = {
  serviceId: string;
  monthlyFee: number;
  currency: string;
  startDate: string;
};

/**
 * Escrituras de la conversión deal→cliente en un único db.batch():
 * con el driver neon-http los statements viajan en un solo round-trip
 * y se ejecutan en una transacción implícita — todo o nada.
 */
export async function convertDealAtomic(params: {
  dealId: string;
  accountId: string;
  wonStageId: string;
  servicesToContract: ServiceToContract[];
  closedAt: Date;
}): Promise<{ deal: Deal | null; contractedServices: AccountService[] }> {
  const { dealId, accountId, wonStageId, servicesToContract, closedAt } =
    params;

  const statements: [BatchItem<"pg">, ...BatchItem<"pg">[]] = [
    db
      .update(deals)
      .set({ position: sql`${deals.position} + 1` })
      .where(and(eq(deals.stageId, wonStageId), gte(deals.position, 0))),
    db
      .update(deals)
      .set({ stageId: wonStageId, position: 0, closedAt, updatedAt: closedAt })
      .where(eq(deals.id, dealId))
      .returning(),
    db
      .update(accounts)
      .set({ status: "active", updatedAt: closedAt })
      .where(eq(accounts.id, accountId)),
    ...servicesToContract.map((s) =>
      db
        .insert(accountServices)
        .values({
          accountId,
          serviceId: s.serviceId,
          monthlyFee: String(s.monthlyFee),
          currency: s.currency,
          startDate: s.startDate,
        })
        .returning(),
    ),
  ];

  const results = await db.batch(statements);

  const dealRows = results[1] as (typeof deals.$inferSelect)[];
  const serviceRows = results.slice(3) as Array<
    (typeof accountServices.$inferSelect)[]
  >;
  return {
    deal: dealRows[0] ? toDeal(dealRows[0]) : null,
    contractedServices: serviceRows.map((rows) => ({
      id: rows[0].id,
      accountId: rows[0].accountId,
      serviceId: rows[0].serviceId,
      monthlyFee: Number(rows[0].monthlyFee),
      currency: rows[0].currency,
      startDate: rows[0].startDate,
      endDate: rows[0].endDate,
      isActive: rows[0].isActive,
    })),
  };
}
