import { z } from "zod";

export const marketingPeriodSchema = z
  .object({
    /** Cliente CRM para filtrar (vía ad_accounts vinculadas); omitir = todos. */
    accountId: z.uuid().nullish(),
    from: z.iso.date().nullish(),
    to: z.iso.date().nullish(),
  })
  .refine((v) => !v.from || !v.to || v.from <= v.to, {
    message: "El rango de fechas es inválido",
    path: ["from"],
  });
export type MarketingPeriodInput = z.infer<typeof marketingPeriodSchema>;

export const adAccountLinkSchema = z.object({
  adAccountId: z.uuid(),
  /** null desvincula la cuenta publicitaria del cliente. */
  accountId: z.uuid().nullable(),
});
export type AdAccountLinkInput = z.infer<typeof adAccountLinkSchema>;
