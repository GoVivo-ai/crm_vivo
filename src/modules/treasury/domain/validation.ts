import { z } from "zod";

export const bankAccountInputSchema = z
  .object({
    name: z.string().trim().min(1, "El nombre es obligatorio").max(200),
    type: z.enum(["bank", "cash", "credit-card"]).nullish(),
    currencyCode: z.string().length(3).default("COP"),
    balance: z.number(),
    /** TRM para consolidar a COP cuando la moneda no es COP. */
    exchangeRate: z.number().positive().nullish(),
    isActive: z.boolean().default(true),
  })
  .refine((v) => v.currencyCode === "COP" || v.exchangeRate != null, {
    message: "Indica la TRM para monedas distintas de COP",
    path: ["exchangeRate"],
  });
export type BankAccountInput = z.infer<typeof bankAccountInputSchema>;

export const bankTransactionInputSchema = z.object({
  bankAccountId: z.uuid(),
  date: z.iso.date(),
  amount: z.number().positive("El monto debe ser mayor a 0"),
  direction: z.enum(["in", "out"]),
  description: z.string().trim().max(500).nullish(),
});
export type BankTransactionInput = z.infer<typeof bankTransactionInputSchema>;
