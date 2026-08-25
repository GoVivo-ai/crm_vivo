// Tipos de dominio de Finanzas 360 (lecturas sobre la cache de Alegra).
// Todos los montos están normalizados a COP (moneda base; las facturas
// EXPORT en USD se convierten con la TRM propia de cada factura).

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

/** Shape de finance_snapshots.pnl.totals (lo escribe Integraciones). */
export type PnlTotals = {
  income: number;
  cost: number;
  productionCost: number;
  expense: number;
  netIncome: number;
};

/** Shape de finance_snapshots.cashflow.summary (lo escribe Integraciones). */
export type CashflowSummary = {
  initialBalance: number;
  income: number;
  expenses: number;
  periodBalance: number;
  finalBalance: number;
};

export type FinanceDashboard = {
  /** Facturación por mes, últimos 12 meses. */
  billing: MonthlyBilling[];
  /** Cartera viva calculada en el momento desde synced_invoices. */
  receivables: Receivables;
  /** P&L del mes en curso, del snapshot más reciente (null si no hay). */
  pnlCurrentMonth: PnlTotals | null;
  /** Cashflow del mes en curso, del snapshot más reciente. */
  cashflowCurrentMonth: CashflowSummary | null;
  /** Fecha del snapshot usado para pnl/cashflow. */
  snapshotDate: string | null;
};

export type PnlSeriesPoint = { date: string; totals: PnlTotals };
export type CashflowSeriesPoint = { date: string; summary: CashflowSummary };

export type SyncSource = "alegra" | "clickup" | "windsor";

export type IntegrationSyncStatus = {
  source: SyncSource;
  status: "running" | "success" | "error";
  startedAt: Date;
  finishedAt: Date | null;
  error: string | null;
  stats: unknown;
};
