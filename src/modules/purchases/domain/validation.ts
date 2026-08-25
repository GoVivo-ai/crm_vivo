import { z } from "zod";

export const expenseInputSchema = z
  .object({
    kind: z.enum(["bill", "direct"]).default("direct"),
    providerName: z.string().trim().min(1, "El proveedor es obligatorio").max(200),
    paymentAccountName: z.string().trim().max(200).nullish(),
    costCenter: z.string().trim().max(100).nullish(),
    txnDate: z.iso.date(),
    dueDate: z.iso.date().nullish(),
    status: z.enum(["open", "paid", "void"]).default("paid"),
    total: z.number().positive("El monto debe ser mayor a 0"),
    currencyCode: z.string().length(3).default("COP"),
    exchangeRate: z.number().positive().nullish(),
    notes: z.string().trim().max(2000).nullish(),
  })
  .refine((v) => v.currencyCode === "COP" || v.exchangeRate != null, {
    message: "Indica la TRM para monedas distintas de COP",
    path: ["exchangeRate"],
  })
  .refine((v) => v.kind === "bill" || v.status !== "open", {
    message: "Un gasto directo no puede quedar pendiente (usa tipo factura)",
    path: ["status"],
  });
export type ExpenseInput = z.infer<typeof expenseInputSchema>;

export const expenseListFilterSchema = z.object({
  kind: z.enum(["bill", "direct"]).nullish(),
  status: z.enum(["open", "paid", "void"]).nullish(),
  from: z.iso.date().nullish(),
  to: z.iso.date().nullish(),
});
export type ExpenseListFilter = z.infer<typeof expenseListFilterSchema>;
