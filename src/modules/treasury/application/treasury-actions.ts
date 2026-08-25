"use server";

import type { ActionResult } from "@/shared/actions/result";
import { runAction } from "@/modules/identity/application/run-action";
import type { TreasuryPosition } from "@/modules/treasury/domain/types";
import {
  listBankAccounts,
  listRecentTransactions,
} from "@/modules/treasury/infrastructure/treasury-repository";
import { getReceivables } from "@/modules/finance/infrastructure/finance-repository";
import { getPayables } from "@/modules/purchases/infrastructure/purchases-repository";

/**
 * Posición de tesorería (treasury:read = finance/management/admin):
 * cuentas con saldos, caja consolidada en COP (main_currency_balance de
 * Alegra), movimientos recientes y proyección simple
 * caja + cartera − cuentas por pagar.
 */
export async function getTreasuryPosition(): Promise<
  ActionResult<TreasuryPosition>
> {
  return runAction("treasury", "read", async () => {
    const [accounts, recentTransactions, receivables, payables] =
      await Promise.all([
        listBankAccounts(),
        listRecentTransactions(30),
        getReceivables(),
        getPayables(),
      ]);

    const totalCashCop = accounts
      .filter((a) => a.status !== "inactive")
      .reduce((acc, a) => acc + (a.balanceCop ?? 0), 0);

    return {
      accounts,
      totalCashCop,
      recentTransactions,
      projection: {
        cashCop: totalCashCop,
        receivablesCop: receivables.outstandingCop,
        payablesCop: payables.outstandingCop,
        netCop:
          totalCashCop + receivables.outstandingCop - payables.outstandingCop,
      },
    };
  });
}
