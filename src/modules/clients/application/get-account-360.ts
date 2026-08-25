"use server";

import { DomainRuleError } from "@/shared/actions/errors";
import type { ActionResult } from "@/shared/actions/result";
import { runAction } from "@/modules/identity/application/run-action";
import type { Account, Contact, Deal } from "@/modules/crm/domain/types";
import { findAccountById } from "@/modules/crm/infrastructure/accounts-repository";
import { listContactsForAccount } from "@/modules/crm/infrastructure/contacts-repository";
import { listDealsForAccount } from "@/modules/crm/infrastructure/deals-repository";
import type {
  AccountServiceWithName,
  Project,
} from "@/modules/clients/domain/types";
import { listServicesForAccount } from "@/modules/clients/infrastructure/services-repository";
import { listProjectsForAccount } from "@/modules/clients/infrastructure/projects-repository";

export type Account360 = {
  account: Account;
  contacts: Contact[];
  deals: Deal[];
  services: AccountServiceWithName[];
  projects: Project[];
  /** Suma de fees mensuales activos, por moneda (ej. { COP: 3500000 }). */
  mrrByCurrency: Record<string, number>;
};

/** Vista 360 de una cuenta (Fase 2; finanzas y ads se suman en F3-F4). */
export async function getAccount360(
  accountId: string,
): Promise<ActionResult<Account360>> {
  return runAction("clients", "read", async () => {
    const account = await findAccountById(accountId);
    if (!account) throw new DomainRuleError("Cuenta no encontrada");

    const [contacts, deals, services, projects] = await Promise.all([
      listContactsForAccount(accountId),
      listDealsForAccount(accountId),
      listServicesForAccount(accountId),
      listProjectsForAccount(accountId),
    ]);

    const mrrByCurrency: Record<string, number> = {};
    for (const s of services) {
      if (!s.isActive) continue;
      mrrByCurrency[s.currency] =
        (mrrByCurrency[s.currency] ?? 0) + s.monthlyFee;
    }

    return { account, contacts, deals, services, projects, mrrByCurrency };
  });
}
