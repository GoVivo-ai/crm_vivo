import type { invoices } from "@/modules/finance/schema";
import type { expenses } from "@/modules/purchases/schema";
import type { bankAccounts } from "@/modules/treasury/schema";
import type {
  QboAccount,
  QboBill,
  QboInvoice,
  QboPurchase,
} from "@/integrations/quickbooks/types";

function num(value: number | undefined | null): string | null {
  if (value === undefined || value === null) return null;
  return String(value);
}

/** Las tablas unificadas exigen fecha; sin TxnDate el registro se salta. */
export function mapQboInvoice(
  invoice: QboInvoice,
): typeof invoices.$inferInsert | null {
  if (!invoice.TxnDate) return null;
  const total = invoice.TotalAmt ?? 0;
  const balance = invoice.Balance ?? 0;
  return {
    source: "quickbooks",
    qboId: invoice.Id,
    number: invoice.DocNumber ?? null,
    clientName: invoice.CustomerRef?.name ?? null,
    issueDate: invoice.TxnDate,
    dueDate: invoice.DueDate ?? null,
    status: balance === 0 ? "paid" : "open",
    total: String(total),
    totalPaid: String(total - balance),
    balance: String(balance),
    currencyCode: invoice.CurrencyRef?.value ?? "USD",
    exchangeRate: num(invoice.ExchangeRate),
    // raw conserva CustomerRef.value para el matcheo con
    // accounts.billing_customer_id (pantalla de no vinculadas).
    raw: invoice,
  };
}

export function mapQboBill(bill: QboBill): typeof expenses.$inferInsert | null {
  if (!bill.TxnDate) return null;
  const balance = bill.Balance ?? 0;
  return {
    source: "quickbooks",
    qboId: bill.Id,
    kind: "bill",
    providerName: bill.VendorRef?.name ?? "Proveedor sin nombre",
    txnDate: bill.TxnDate,
    dueDate: bill.DueDate ?? null,
    status: balance === 0 ? "paid" : "open",
    total: String(bill.TotalAmt ?? 0),
    balance: String(balance),
    currencyCode: bill.CurrencyRef?.value ?? "USD",
    raw: bill,
  };
}

/** Gasto directo (Purchase): aquí llegan los cargos de Chase categorizados. */
export function mapQboPurchase(
  purchase: QboPurchase,
): typeof expenses.$inferInsert | null {
  if (!purchase.TxnDate) return null;
  return {
    source: "quickbooks",
    qboId: purchase.Id,
    kind: "direct",
    providerName: purchase.EntityRef?.name ?? "Sin beneficiario",
    paymentAccountName: purchase.AccountRef?.name ?? null,
    txnDate: purchase.TxnDate,
    status: "paid",
    total: String(purchase.TotalAmt ?? 0),
    balance: "0",
    currencyCode: purchase.CurrencyRef?.value ?? "USD",
    raw: purchase,
  };
}

const TYPE_MAP: Record<string, string> = {
  Bank: "bank",
  "Credit Card": "credit-card",
};

export function mapQboAccount(
  account: QboAccount,
): typeof bankAccounts.$inferInsert {
  return {
    source: "quickbooks",
    qboId: account.Id,
    name: account.Name,
    type: TYPE_MAP[account.AccountType ?? ""] ?? "bank",
    balance: String(account.CurrentBalance ?? 0),
    currencyCode: account.CurrencyRef?.value ?? "USD",
    balanceUpdatedAt: new Date(),
    isActive: account.Active ?? true,
    raw: account,
  };
}
