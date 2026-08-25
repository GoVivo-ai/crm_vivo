// Tipos de dominio de RR.HH. El salario y el costo de nómina viven SOLO
// detrás de people_compensation; el directorio nunca los incluye.

export type LeaveType = "vacation" | "sick" | "personal" | "unpaid" | "other";
export type LeaveStatus = "requested" | "approved" | "rejected";

export type EmployeeDocument = {
  name: string;
  url: string;
  expiresAt?: string;
};

/** Directorio (people_directory) — SIN datos de compensación. */
export type TeamMember = {
  alegraEmployeeId: string;
  fullName: string;
  identification: string | null;
  /** Del expediente si existe; si no, el del directorio de Alegra. */
  position: string | null;
  area: string | null;
  status: string | null;
  profile: {
    id: string;
    userId: string | null;
    contractType: string | null;
    contractEndDate: string | null;
    documents: EmployeeDocument[];
    annualLeaveDays: number;
    notes: string | null;
  } | null;
};

/** Expediente con compensación (people_compensation). */
export type EmployeeCompensation = {
  alegraEmployeeId: string;
  fullName: string;
  /** Salario del directorio de Alegra — puede estar DESACTUALIZADO; se
   * muestra como "salario registrado en Alegra", nunca alimenta series. */
  registeredSalary: number | null;
  contract: unknown;
};

/** Punto de la serie de costo de nómina, derivado de pagos categorizados
 * (la API de payroll no está en el plan de Alegra). */
export type PayrollCostPoint = {
  month: string; // YYYY-MM
  totalCop: number;
  payments: number;
};

export type PayrollCostSeries = {
  /** Etiqueta OBLIGATORIA en UI (requisito del Planeador). */
  label: "costo de nómina (desde pagos)";
  points: PayrollCostPoint[];
};

export type LeaveRequestView = {
  id: string;
  employeeProfileId: string;
  employeeName: string | null;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string | null;
  status: LeaveStatus;
  requestedBy: string;
  decidedBy: string | null;
  decidedAt: Date | null;
  decisionNote: string | null;
  createdAt: Date;
};

/** Saldo anual de días del empleado del guard. */
export type LeaveBalance = {
  annualLeaveDays: number;
  approvedDaysThisYear: number;
  remainingDays: number;
};
