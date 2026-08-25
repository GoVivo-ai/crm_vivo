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
 * derivada de pagos, nunca registeredSalary) por CAPACIDAD TOTAL:
 * costo(cuenta, mes) = nómina(mes) × Σ%dedicación(cuenta, mes)
 *                      / (100 × empleados_activos).
 * Lo no asignado queda como "costo sin asignar" (compañía) — así la
 * adopción gradual del staffing no distorsiona los márgenes. Supone
 * costo igual por empleado (assumption: 'equal-cost' en el dashboard).
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
  /** % de dedicación global asignada. */
  totalAssignedPercent: number;
  /** Nómina del periodo NO asignada a cuentas (compañía) — visible en UI. */
  unassignedCostCop: number;
  /** Empleados activos usados como capacidad (conteo actual del
   * directorio; no hay historial mensual). */
  activeEmployees: number;
  /** Suposición del prorrateo, para mostrarla como nota en la UI. */
  assumption: "equal-cost";
  accounts: AccountProfitability[];
};
