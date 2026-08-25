// Tipos de dominio de Finanzas — registros propios del ERP (manual +
// QuickBooks). Montos normalizados a COP con la TRM de cada documento.

export type RecordSource = "manual" | "quickbooks";
export type InvoiceStatus = "open" | "paid" | "void";

export type Invoice = {
  id: string;
  source: RecordSource; // editable/borrable solo cuando 'manual'
  number: string | null;
  accountId: string | null;
  accountName: string | null;
  clientName: string | null;
  issueDate: string;
  dueDate: string | null;
  status: InvoiceStatus;
  total: number;
  totalPaid: number;
  balance: number;
  currencyCode: string;
  exchangeRate: number | null;
  notes: string | null;
};

export type AgingBucketId = "current" | "1-30" | "31-60" | "61-90" | "90+";

export type AgingBucket = {
  bucket: AgingBucketId;
  amountCop: number;
  invoices: number;
};

export type Receivables = {
  openInvoices: number;
  outstandingCop: number;
  aging: AgingBucket[];
};

export type MonthlyBilling = {
  month: string; // YYYY-MM
  totalCop: number;
  invoices: number;
};

/** P&L mensual CALCULADO desde registros propios:
 * netIncome = income − expenses − payroll. */
export type PnlPoint = {
  month: string;
  incomeCop: number;
  expensesCop: number;
  payrollCop: number;
  netIncomeCop: number;
};

/** Flujo de caja mensual desde movimientos bancarios registrados. */
export type CashflowPoint = {
  month: string;
  inflowCop: number;
  outflowCop: number;
  netCop: number;
};

export type FinanceDashboard = {
  billing: MonthlyBilling[]; // últimos 12 meses
  receivables: Receivables;
  pnlCurrentMonth: PnlPoint | null;
  cashflowCurrentMonth: CashflowPoint | null;
};

export type SyncSource = "quickbooks" | "clickup" | "meta_ads";

export type IntegrationSyncStatus = {
  source: SyncSource;
  status: "running" | "success" | "error";
  startedAt: Date;
  finishedAt: Date | null;
  error: string | null;
  stats: unknown;
};
