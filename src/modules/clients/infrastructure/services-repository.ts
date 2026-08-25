import { asc, eq } from "drizzle-orm";
import { db } from "@/shared/database/db";
import { accountServices, services } from "@/modules/clients/schema";
import type {
  AccountService,
  AccountServiceWithName,
  Service,
} from "@/modules/clients/domain/types";
import type {
  AccountServiceInput,
  ServiceInput,
} from "@/modules/clients/domain/validation";

const toNumber = (v: string | null) => (v === null ? null : Number(v));

function toService(row: typeof services.$inferSelect): Service {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    defaultMonthlyFee: toNumber(row.defaultMonthlyFee),
    isActive: row.isActive,
  };
}

function toAccountService(
  row: typeof accountServices.$inferSelect,
): AccountService {
  return {
    id: row.id,
    accountId: row.accountId,
    serviceId: row.serviceId,
    monthlyFee: Number(row.monthlyFee),
    currency: row.currency,
    startDate: row.startDate,
    endDate: row.endDate,
    isActive: row.isActive,
  };
}

export async function listServices(): Promise<Service[]> {
  const rows = await db.select().from(services).orderBy(asc(services.name));
  return rows.map(toService);
}

export async function insertService(input: ServiceInput): Promise<Service> {
  const rows = await db
    .insert(services)
    .values({
      name: input.name,
      description: input.description ?? null,
      defaultMonthlyFee:
        input.defaultMonthlyFee != null ? String(input.defaultMonthlyFee) : null,
      isActive: input.isActive,
    })
    .returning();
  return toService(rows[0]);
}

export async function listServicesForAccount(
  accountId: string,
): Promise<AccountServiceWithName[]> {
  const rows = await db
    .select({ accountService: accountServices, serviceName: services.name })
    .from(accountServices)
    .innerJoin(services, eq(accountServices.serviceId, services.id))
    .where(eq(accountServices.accountId, accountId))
    .orderBy(asc(accountServices.startDate));
  return rows.map((r) => ({
    ...toAccountService(r.accountService),
    serviceName: r.serviceName,
  }));
}

export async function insertAccountService(
  input: AccountServiceInput,
): Promise<AccountService> {
  const rows = await db
    .insert(accountServices)
    .values({
      accountId: input.accountId,
      serviceId: input.serviceId,
      monthlyFee: String(input.monthlyFee),
      currency: input.currency,
      startDate: input.startDate,
    })
    .returning();
  return toAccountService(rows[0]);
}

export async function endAccountService(
  id: string,
  endDate: string,
): Promise<AccountService | null> {
  const rows = await db
    .update(accountServices)
    .set({ endDate, isActive: false, updatedAt: new Date() })
    .where(eq(accountServices.id, id))
    .returning();
  return rows[0] ? toAccountService(rows[0]) : null;
}
