"use server";

import { revalidatePath } from "next/cache";
import { actionError, type ActionResult } from "@/shared/actions/result";
import { runAction } from "@/modules/identity/application/run-action";
import { parseInput } from "@/modules/crm/application/action-helpers";
import type {
  AccountService,
  AccountServiceWithName,
  Service,
} from "@/modules/clients/domain/types";
import {
  accountServiceInputSchema,
  endAccountServiceSchema,
  serviceInputSchema,
} from "@/modules/clients/domain/validation";
import * as repo from "@/modules/clients/infrastructure/services-repository";

export async function listServices(): Promise<ActionResult<Service[]>> {
  return runAction("clients", "read", () => repo.listServices());
}

export async function createService(
  input: unknown,
): Promise<ActionResult<Service>> {
  const parsed = parseInput(serviceInputSchema, input);
  if (!parsed.ok) return parsed.result;
  return runAction("clients", "write", async () => {
    const service = await repo.insertService(parsed.data);
    revalidatePath("/clients");
    return service;
  });
}

export async function listServicesForAccount(
  accountId: string,
): Promise<ActionResult<AccountServiceWithName[]>> {
  return runAction("clients", "read", () =>
    repo.listServicesForAccount(accountId),
  );
}

export async function addServiceToAccount(
  input: unknown,
): Promise<ActionResult<AccountService>> {
  const parsed = parseInput(accountServiceInputSchema, input);
  if (!parsed.ok) return parsed.result;
  return runAction("clients", "write", async () => {
    const accountService = await repo.insertAccountService(parsed.data);
    revalidatePath("/clients");
    return accountService;
  });
}

export async function endServiceForAccount(
  input: unknown,
): Promise<ActionResult<AccountService>> {
  const parsed = parseInput(endAccountServiceSchema, input);
  if (!parsed.ok) return parsed.result;
  const result = await runAction("clients", "write", () =>
    repo.endAccountService(parsed.data.accountServiceId, parsed.data.endDate),
  );
  if (result.ok && result.data === null) {
    return actionError("Servicio contratado no encontrado");
  }
  revalidatePath("/clients");
  return result as ActionResult<AccountService>;
}
