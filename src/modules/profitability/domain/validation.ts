import { z } from "zod";

export const staffingInputSchema = z
  .object({
    accountId: z.uuid(),
    employeeId: z.uuid(),
    dedicationPercent: z.number().int().min(1).max(100),
    validFrom: z.iso.date().nullish(),
    validTo: z.iso.date().nullish(),
  })
  .refine((v) => !v.validFrom || !v.validTo || v.validFrom <= v.validTo, {
    message: "La vigencia es inválida",
    path: ["validFrom"],
  });
export type StaffingInput = z.infer<typeof staffingInputSchema>;

export const profitabilityPeriodSchema = z
  .object({
    from: z.iso.date().nullish(),
    to: z.iso.date().nullish(),
  })
  .refine((v) => !v.from || !v.to || v.from <= v.to, {
    message: "El rango de fechas es inválido",
    path: ["from"],
  });
