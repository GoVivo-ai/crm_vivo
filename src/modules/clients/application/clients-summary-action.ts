"use server";

import type { ActionResult } from "@/shared/actions/result";
import { runAction } from "@/modules/identity/application/run-action";
import type { ProjectHealth } from "@/modules/clients/domain/types";
import {
  countActiveClients,
  countProjectsByHealth,
  getMrrByCurrency,
} from "@/modules/clients/infrastructure/clients-summary-repository";

export type ClientsSummary = {
  activeClients: number;
  /** MRR global (fees mensuales activos) por moneda, ej. { COP: 35000000 }. */
  mrrByCurrency: Record<string, number>;
  /** Proyectos de cuentas activas por semáforo de salud. */
  projectsByHealth: Record<ProjectHealth, number>;
};

/** Resumen agregado de clientes para el panel del home 360 (Fase 5). */
export async function getClientsSummary(): Promise<
  ActionResult<ClientsSummary>
> {
  return runAction("clients", "read", async () => {
    const [activeClients, mrrByCurrency, projectsByHealth] =
      await Promise.all([
        countActiveClients(),
        getMrrByCurrency(),
        countProjectsByHealth(),
      ]);
    return { activeClients, mrrByCurrency, projectsByHealth };
  });
}
