import { z } from "zod";

export const serviceInputSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(200),
  description: z.string().trim().max(2000).nullish(),
  defaultMonthlyFee: z.number().nonnegative().nullish(),
  isActive: z.boolean().default(true),
});
export type ServiceInput = z.infer<typeof serviceInputSchema>;

export const accountServiceInputSchema = z.object({
  accountId: z.uuid(),
  serviceId: z.uuid(),
  monthlyFee: z.number().nonnegative(),
  currency: z.string().length(3).default("COP"),
  startDate: z.iso.date(),
});
export type AccountServiceInput = z.infer<typeof accountServiceInputSchema>;

export const endAccountServiceSchema = z.object({
  accountServiceId: z.uuid(),
  endDate: z.iso.date(),
});
export type EndAccountServiceInput = z.infer<typeof endAccountServiceSchema>;

export const projectInputSchema = z.object({
  accountId: z.uuid(),
  name: z.string().trim().min(1, "El nombre es obligatorio").max(200),
  clickupListId: z
    .string()
    .trim()
    .max(100)
    .transform((v) => (v === "" ? null : v))
    .nullish(),
  startDate: z.iso.date().nullish(),
  endDate: z.iso.date().nullish(),
});
export type ProjectInput = z.infer<typeof projectInputSchema>;

export const convertDealSchema = z.object({
  dealId: z.uuid(),
  // Servicios a contratar al convertir (opcional; se pueden agregar luego).
  services: z
    .array(
      z.object({
        serviceId: z.uuid(),
        monthlyFee: z.number().nonnegative(),
        currency: z.string().length(3).default("COP"),
        startDate: z.iso.date(),
      }),
    )
    .default([]),
});
export type ConvertDealInput = z.infer<typeof convertDealSchema>;
