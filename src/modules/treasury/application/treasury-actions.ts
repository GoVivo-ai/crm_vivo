"use server";

import { revalidatePath } from "next/cache";
import { DomainRuleError } from "@/shared/actions/errors";
import { actionError, type ActionResult } from "@/shared/actions/result";
import { runAction } from "@/modules/identity/application/run-action";
import { parseInput } from "@/modules/crm/application/action-helpers";
import type {
  BankAccountView,
  BankTransactionView,
  TreasuryPosition,
} from "@/modules/treasury/domain/types";
import {
  bankAccountInputSchema,
  bankTransactionInputSchema,
} from "@/modules/treasury/domain/validation";
import * as repo from "@/modules/treasury/infrastructure/treasury-repository";
import { getReceivables } from "@/modules/finance/infrastructure/finance-repository";
import { getPayables } from "@/modules/purchases/infrastructure/purchases-repository";

/** Posición de tesorería (treasury:read): cuentas con saldos, caja
 * consolidada COP, movimientos recientes y proyección simple. */
export async function getTreasuryPosition(): Promise<
  ActionResult<TreasuryPosition>
> {
  return runAction("treasury", "read", async () => {
    const [accounts, recentTransactions, receivables, payables] =
      await Promise.all([
        repo.listBankAccounts(),
        repo.listRecentTransactions(30),
        getReceivables(),
        getPayables(),
      ]);
    const totalCashCop = accounts
      .filter((a) => a.isActive)
      .reduce((acc, a) => acc + a.balanceCop, 0);
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

/** Alta manual de cuenta bancaria (treasury:write). */
export async function createBankAccount(
  input: unknown,
): Promise<ActionResult<BankAccountView>> {
  const parsed = parseInput(bankAccountInputSchema, input);
  if (!parsed.ok) return parsed.result;
  return runAction("treasury", "write", async () => {
    const account = await repo.insertBankAccount(parsed.data);
    revalidatePath("/treasury");
    return account;
  });
}

/** Edición/actualización de saldo — SOLO cuentas manuales. */
export async function updateBankAccount(
  id: string,
  input: unknown,
): Promise<ActionResult<BankAccountView>> {
  const parsed = parseInput(bankAccountInputSchema, input);
  if (!parsed.ok) return parsed.result;
  return runAction("treasury", "write", async () => {
    const existing = await repo.findBankAccountRow(id);
    if (!existing) throw new DomainRuleError("Cuenta no encontrada");
    if (existing.source !== "manual") {
      throw new DomainRuleError(
        "Las cuentas sincronizadas de QuickBooks son de solo lectura",
      );
    }
    const account = await repo.updateBankAccountById(id, parsed.data);
    if (!account) throw new DomainRuleError("Cuenta no encontrada");
    revalidatePath("/treasury");
    return account;
  });
}

/** Registro manual de movimiento (treasury:write). */
export async function createBankTransaction(
  input: unknown,
): Promise<ActionResult<BankTransactionView>> {
  const parsed = parseInput(bankTransactionInputSchema, input);
  if (!parsed.ok) return parsed.result;
  return runAction("treasury", "write", async (user) => {
    const account = await repo.findBankAccountRow(parsed.data.bankAccountId);
    if (!account) throw new DomainRuleError("Cuenta no encontrada");
    const tx = await repo.insertTransaction(parsed.data, user.id);
    revalidatePath("/treasury");
    return tx;
  });
}

export async function deleteBankTransaction(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  const result = await runAction("treasury", "write", () =>
    repo.deleteTransactionById(id),
  );
  if (!result.ok) return result;
  if (!result.data) return actionError("Movimiento no encontrado");
  revalidatePath("/treasury");
  return { ok: true, data: { id } };
}

export type BankAccountOption = {
  id: string;
  name: string;
  currencyCode: string;
};

/** Opciones ligeras de cuenta bancaria para selects/Spotlight
 * (treasury:read) — sin saldos ni proyecciones. */
export async function listBankAccountOptions(): Promise<
  ActionResult<BankAccountOption[]>
> {
  return runAction("treasury", "read", async () => {
    const accounts = await repo.listBankAccounts();
    return accounts
      .filter((a) => a.isActive)
      .map(({ id, name, currencyCode }) => ({ id, name, currencyCode }));
  });
}
