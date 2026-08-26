"use server";

import { asc } from "drizzle-orm";
import {
  actionError,
  actionOk,
  type ActionResult,
} from "@/shared/actions/result";
import { db } from "@/shared/database/db";
import { users } from "@/modules/identity/schema";
import { getCurrentUser } from "@/modules/identity/application/get-current-user";

export type UserName = { id: string; name: string };

/** Lookup ligero id→nombre para owners/autores (deals, actividades,
 * timeline). Cualquier usuario ACTIVO: los nombres de compañeros ya son
 * visibles para todos vía people_directory; aquí no viaja nada más. */
export async function listUserNames(): Promise<ActionResult<UserName[]>> {
  const user = await getCurrentUser();
  if (!user) return actionError("Sesión no válida");
  try {
    const rows = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .orderBy(asc(users.name));
    return actionOk(rows.map((r) => ({ id: r.id, name: r.name ?? r.email })));
  } catch (error) {
    console.error("[identity listUserNames]", error);
    return actionError("Error inesperado, intenta de nuevo");
  }
}
