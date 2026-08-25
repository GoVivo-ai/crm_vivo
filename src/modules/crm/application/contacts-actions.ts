"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/shared/actions/result";
import { actionError } from "@/shared/actions/result";
import type { Contact } from "@/modules/crm/domain/types";
import {
  contactInputSchema,
  listFilterSchema,
  type ListFilter,
} from "@/modules/crm/domain/validation";
import * as repo from "@/modules/crm/infrastructure/contacts-repository";
import {
  parseInput,
  runCrmAction,
} from "@/modules/crm/application/action-helpers";

export async function listContacts(
  filter: ListFilter = {},
): Promise<ActionResult<Contact[]>> {
  const parsed = parseInput(listFilterSchema, filter);
  if (!parsed.ok) return parsed.result;
  return runCrmAction("read", () => repo.listContacts(parsed.data));
}

export async function getContact(
  id: string,
): Promise<ActionResult<Contact>> {
  return runCrmAction("read", async () => {
    const contact = await repo.findContactById(id);
    if (!contact) throw new Error("Contacto no encontrado");
    return contact;
  });
}

export async function createContact(
  input: unknown,
): Promise<ActionResult<Contact>> {
  const parsed = parseInput(contactInputSchema, input);
  if (!parsed.ok) return parsed.result;
  return runCrmAction("write", async () => {
    const contact = await repo.insertContact(parsed.data);
    revalidatePath("/crm");
    return contact;
  });
}

export async function updateContact(
  id: string,
  input: unknown,
): Promise<ActionResult<Contact>> {
  const parsed = parseInput(contactInputSchema, input);
  if (!parsed.ok) return parsed.result;
  const result = await runCrmAction("write", () =>
    repo.updateContactById(id, parsed.data),
  );
  if (result.ok && result.data === null) {
    return actionError("Contacto no encontrado");
  }
  revalidatePath("/crm");
  return result as ActionResult<Contact>;
}
