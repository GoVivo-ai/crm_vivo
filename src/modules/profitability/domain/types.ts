// Rentabilidad por cliente (Fase 9) — todo en COP.

export type StaffingAssignment = {
  id: string;
  accountId: string;
  accountName: string | null;
  alegraEmployeeId: string;
  employeeName: string | null;
  dedicationPercent: number;
  validFrom: string | null;
  validTo: string | null;
};

/**
 * Desglose del margen por cuenta. Componentes por separado (requisito
 * del Planeador) para que la UI muestre el detalle.
 *
 * staffingCostCop se prorratea del costo REAL de nómina mensual (serie
 * derivada de pagos, nunca registeredSalary): para cada mes,
 * costo(cuenta) = nómina(mes) × Σ%dedicación(cuenta) / Σ%dedicación
 * global asignada ese mes. Así el 100% del costo se reparte entre las
 * cuentas proporcionalmente a la dedicación asignada.
 *
 * adSpendCop es INFORMATIVO y NO se resta del margen: en esta agencia el
 * cliente normalmente paga su pauta directo (pendiente de confirmación
 * final con datos; si cambia, el flag pasa a restarse explícitamente).
 */
export type AccountProfitability = {
  accountId: string;
  accountName: string;
  revenueCop: number;
  staffingCostCop: number;
  /** % de dedicación total asignada a la cuenta (puede ser > 100). */
  assignedDedicationPercent: number;
  adSpendCop: number;
  adSpendIncludedInMargin: false;
  marginCop: number; // revenue − staffingCost
  marginPercent: number | null; // null si revenue = 0
};

export type ProfitabilityDashboard = {
  period: { from: string; to: string };
  /** Nómina total del periodo (misma serie etiquetada de people). */
  totalPayrollCop: number;
  /** % de dedicación global asignada (base del prorrateo). */
  totalAssignedPercent: number;
  accounts: AccountProfitability[];
};
