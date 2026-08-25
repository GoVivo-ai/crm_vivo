import type { Role } from "@/modules/identity/domain/permissions";

/** Tipo de dominio expuesto a la UI — nunca la fila Drizzle cruda. */
export type CurrentUser = {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  role: Role;
  isActive: boolean;
};
