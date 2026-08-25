import type { syncedInvoices, syncedPayments } from "@/modules/finance/schema";
import type { AlegraInvoice, AlegraPayment } from "@/integrations/alegra/types";

type InvoiceRow = typeof syncedInvoices.$inferInsert;
type PaymentRow = typeof syncedPayments.$inferInsert;

/** numeric de Drizzle viaja como string; null si Alegra no envía el campo. */
function num(value: number | string | undefined | null): string | null {
  if (value === undefined || value === null) return null;
  return String(value);
}

export function mapInvoice(invoice: AlegraInvoice): InvoiceRow {
  return {
    alegraInvoiceId: String(invoice.id),
    numberFull: invoice.numberTemplate?.fullNumber ?? null,
    alegraClientId: invoice.client ? String(invoice.client.id) : null,
    date: invoice.date ?? null,
    dueDate: invoice.dueDate ?? null,
    status: invoice.status ?? null,
    stampLegalStatus: invoice.stamp?.legalStatus ?? null,
    subtotal: num(invoice.subtotal),
    tax: num(invoice.tax),
    total: num(invoice.total),
    totalPaid: num(invoice.totalPaid),
    balance: num(invoice.balance),
    currencyCode: invoice.currency?.code ?? "COP",
    exchangeRate: num(invoice.currency?.exchangeRate),
    raw: invoice,
    syncedAt: new Date(),
  };
}

/** Solo se llama con pagos type=in (el sync filtra los egresos). */
export function mapPayment(payment: AlegraPayment): PaymentRow {
  return {
    alegraPaymentId: String(payment.id),
    alegraClientId: payment.client ? String(payment.client.id) : null,
    date: payment.date ?? null,
    amount: num(payment.amount),
    invoiceIds:
      payment.invoices?.map((inv) => ({
        id: String(inv.id),
        number: inv.number ?? null,
        amount: inv.amount ?? null,
      })) ?? [],
    bankAccount: payment.bankAccount?.name ?? null,
    costCenter: payment.costCenter
      ? `${payment.costCenter.code ?? ""} ${payment.costCenter.name ?? ""}`.trim()
      : null,
    raw: payment,
    syncedAt: new Date(),
  };
}
