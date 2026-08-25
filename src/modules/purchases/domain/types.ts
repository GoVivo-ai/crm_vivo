import type {
  AgingBucket,
  RecordSource,
} from "@/modules/finance/domain/types";

// Gastos y compras — registros propios (manual + QuickBooks), en COP.

export type ExpenseKind = "bill" | "direct";
export type ExpenseStatus = "open" | "paid" | "void";

export type Expense = {
  id: string;
  source: RecordSource; // editable/borrable solo cuando 'manual'
  kind: ExpenseKind;
  providerName: string;
  paymentAccountName: string | null;
  costCenter: string | null;
  txnDate: string;
  dueDate: string | null;
  status: ExpenseStatus;
  total: number;
  balance: number;
  currencyCode: string;
  exchangeRate: number | null;
  notes: string | null;
};

export type MonthlySpend = {
  month: string; // YYYY-MM
  totalCop: number;
  expenses: number;
};

export type SpendByCostCenter = {
  costCenter: string | null;
  totalCop: number;
  expenses: number;
};

export type SpendByProvider = {
  providerName: string;
  totalCop: number;
  expenses: number;
};

export type Payables = {
  openBills: number;
  outstandingCop: number;
  aging: AgingBucket[];
};

export type PurchasesDashboard = {
  period: { from: string; to: string };
  spendByMonth: MonthlySpend[]; // últimos 12 meses
  byCostCenter: SpendByCostCenter[]; // del periodo
  byProvider: SpendByProvider[]; // top del periodo
  payables: Payables; // solo kind=bill con saldo
};
