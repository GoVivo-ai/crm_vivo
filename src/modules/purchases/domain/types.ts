import type { AgingBucket } from "@/modules/finance/domain/types";

// Tipos de dominio de Gastos y compras (Fase 6). Montos en COP
// (normalizados con la TRM de cada documento).

export type MonthlySpend = {
  month: string; // YYYY-MM
  totalCop: number;
  bills: number;
};

export type SpendByCostCenter = {
  costCenter: string | null; // null = sin centro de costo asignado
  totalCop: number;
  bills: number;
};

export type SpendByProvider = {
  alegraProviderId: string | null;
  providerName: string | null;
  totalCop: number;
  bills: number;
};

export type Payables = {
  openBills: number;
  outstandingCop: number;
  aging: AgingBucket[];
};

export type PurchasesDashboard = {
  period: { from: string; to: string };
  /** Gasto por mes, últimos 12 meses (independiente del period). */
  spendByMonth: MonthlySpend[];
  /** Del periodo pedido (default mes en curso). */
  byCostCenter: SpendByCostCenter[];
  /** Top proveedores del periodo, por gasto descendente. */
  byProvider: SpendByProvider[];
  /** Cuentas por pagar vivas (no dependen del periodo). */
  payables: Payables;
};
