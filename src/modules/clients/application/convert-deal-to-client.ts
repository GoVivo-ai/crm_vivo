"use server";

import { revalidatePath } from "next/cache";
import { DomainRuleError } from "@/shared/actions/errors";
import type { ActionResult } from "@/shared/actions/result";
import { runAction } from "@/modules/identity/application/run-action";
import { parseInput } from "@/modules/crm/application/action-helpers";
import type { Deal } from "@/modules/crm/domain/types";
import * as dealsRepo from "@/modules/crm/infrastructure/deals-repository";
import type { AccountService } from "@/modules/clients/domain/types";
import { convertDealSchema } from "@/modules/clients/domain/validation";
import {
  convertDealAtomic,
  findExistingServiceIds,
} from "@/modules/clients/infrastructure/convert-deal-repository";

export type ConvertDealResult = {
  deal: Deal;
  accountId: string;
  contractedServices: AccountService[];
};

/**
 * Caso de uso de Fase 2: al ganar un deal, la cuenta pasa a cliente activo.
 * Valida todo ANTES de escribir y ejecuta las escrituras (deal→etapa
 * ganada, cuenta→active, alta de servicios) en un único batch atómico.
 * Permiso: crm write — lo ejecuta ventas al cerrar la venta.
 */
export async function convertDealToClient(
  input: unknown,
): Promise<ActionResult<ConvertDealResult>> {
  const parsed = parseInput(convertDealSchema, input);
  if (!parsed.ok) return parsed.result;
  const { dealId, services } = parsed.data;

  return runAction("crm", "write", async () => {
    const deal = await dealsRepo.findDealById(dealId);
    if (!deal) throw new DomainRuleError("Deal no encontrado");
    if (deal.closedAt) {
      throw new DomainRuleError("El deal ya está cerrado");
    }

    const wonStage = await dealsRepo.findWonStage();
    if (!wonStage) {
      throw new DomainRuleError(
        "No existe una etapa ganada en el pipeline (revisa el seed)",
      );
    }

    const serviceIds = services.map((s) => s.serviceId);
    const existing = new Set(await findExistingServiceIds(serviceIds));
    const missing = serviceIds.filter((id) => !existing.has(id));
    if (missing.length > 0) {
      throw new DomainRuleError(
        "Hay servicios que no existen en el catálogo; recarga e intenta de nuevo",
      );
    }

    const result = await convertDealAtomic({
      dealId,
      accountId: deal.accountId,
      wonStageId: wonStage.id,
      servicesToContract: services,
      closedAt: new Date(),
    });

    revalidatePath("/crm");
    revalidatePath("/clients");
    return {
      deal: result.deal ?? deal,
      accountId: deal.accountId,
      contractedServices: result.contractedServices,
    };
  });
}
