"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/shared/actions/result";
import { actionError } from "@/shared/actions/result";
import type { Account } from "@/modules/crm/domain/types";
import {
  accountInputSchema,
  listFilterSchema,
  type ListFilter,
} from "@/modules/crm/domain/validation";
import * as repo from "@/modules/crm/infrastructure/accounts-repository";
import {
  parseInput,
  runCrmAction,
} from "@/modules/crm/application/action-helpers";

export async function listAccounts(
  filter: ListFilter = {},
): Promise<ActionResult<Account[]>> {
  const parsed = parseInput(listFilterSchema, filter);
  if (!parsed.ok) return parsed.result;
  return runCrmAction("read", () => repo.listAccounts(parsed.data));
}

export async function getAccount(
  id: string,
): Promise<ActionResult<Account>> {
  return runCrmAction("read", async () => {
    const account = await repo.findAccountById(id);
    if (!account) throw new Error("Cuenta no encontrada");
    return account;
  });
}

export async function createAccount(
  input: unknown,
): Promise<ActionResult<Account>> {
  const parsed = parseInput(accountInputSchema, input);
  if (!parsed.ok) return parsed.result;
  return runCrmAction("write", async () => {
    const account = await repo.insertAccount(parsed.data);
    revalidatePath("/crm");
    return account;
  });
}

export async function updateAccount(
  id: string,
  input: unknown,
): Promise<ActionResult<Account>> {
  const parsed = parseInput(accountInputSchema, input);
  if (!parsed.ok) return parsed.result;
  const result = await runCrmAction("write", () =>
    repo.updateAccountById(id, parsed.data),
  );
  if (result.ok && result.data === null) {
    return actionError("Cuenta no encontrada");
  }
  revalidatePath("/crm");
  return result as ActionResult<Account>;
}
