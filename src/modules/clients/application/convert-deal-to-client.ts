"use server";

import { revalidatePath } from "next/cache";
import { DomainRuleError } from "@/shared/actions/errors";
import type { ActionResult } from "@/shared/actions/result";
import { runAction } from "@/modules/identity/application/run-action";
import { parseInput } from "@/modules/crm/application/action-helpers";
import type { Deal } from "@/modules/crm/domain/types";
import * as dealsRepo from "@/modules/crm/infrastructure/deals-repository";
import { setAccountStatus } from "@/modules/crm/infrastructure/accounts-repository";
import type { AccountService } from "@/modules/clients/domain/types";
import { convertDealSchema } from "@/modules/clients/domain/validation";
import { insertAccountService } from "@/modules/clients/infrastructure/services-repository";

export type ConvertDealResult = {
  deal: Deal;
  accountId: string;
  contractedServices: AccountService[];
};

/**
 * Caso de uso de Fase 2: al ganar un deal, la cuenta pasa a cliente activo.
 * Mueve el deal a la etapa ganada (closedAt = ahora), marca la cuenta como
 * "active" y contrata los servicios indicados (opcional).
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

    const movedDeal = await dealsRepo.moveDeal(
      dealId,
      wonStage.id,
      0,
      new Date(),
    );
    await setAccountStatus(deal.accountId, "active");

    const contractedServices: AccountService[] = [];
    for (const service of services) {
      contractedServices.push(
        await insertAccountService({
          accountId: deal.accountId,
          serviceId: service.serviceId,
          monthlyFee: service.monthlyFee,
          currency: service.currency,
          startDate: service.startDate,
        }),
      );
    }

    revalidatePath("/crm");
    revalidatePath("/clients");
    return {
      deal: movedDeal ?? deal,
      accountId: deal.accountId,
      contractedServices,
    };
  });
}
