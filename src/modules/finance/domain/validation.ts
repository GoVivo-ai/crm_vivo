import { z } from "zod";

export const invoiceInputSchema = z
  .object({
    accountId: z.uuid().nullish(),
    clientName: z.string().trim().max(200).nullish(),
    number: z.string().trim().max(50).nullish(),
    issueDate: z.iso.date(),
    dueDate: z.iso.date().nullish(),
    status: z.enum(["open", "paid", "void"]).default("open"),
    total: z.number().positive("El monto debe ser mayor a 0"),
    totalPaid: z.number().nonnegative().default(0),
    currencyCode: z.string().length(3).default("COP"),
    /** Obligatoria cuando la moneda no es COP (normalización). */
    exchangeRate: z.number().positive().nullish(),
    notes: z.string().trim().max(2000).nullish(),
  })
  .refine((v) => v.accountId || v.clientName, {
    message: "Indica la cuenta CRM o el nombre del cliente",
    path: ["accountId"],
  })
  .refine((v) => v.currencyCode === "COP" || v.exchangeRate != null, {
    message: "Indica la TRM para monedas distintas de COP",
    path: ["exchangeRate"],
  })
  .refine((v) => v.totalPaid <= v.total, {
    message: "Lo pagado no puede superar el total",
    path: ["totalPaid"],
  });
export type InvoiceInput = z.infer<typeof invoiceInputSchema>;

export const invoiceListFilterSchema = z.object({
  accountId: z.uuid().nullish(),
  status: z.enum(["open", "paid", "void"]).nullish(),
  from: z.iso.date().nullish(),
  to: z.iso.date().nullish(),
});
export type InvoiceListFilter = z.infer<typeof invoiceListFilterSchema>;
