// Tipos de dominio de RR.HH. — empleados y nómina como registros propios
// del ERP (QBO Payroll no tiene API). La compensación vive SOLO detrás
// de people_compensation; el directorio nunca la incluye.

export type LeaveType = "vacation" | "sick" | "personal" | "unpaid" | "other";
export type LeaveStatus = "requested" | "approved" | "rejected";

export type EmployeeDocument = {
  name: string;
  url: string;
  expiresAt?: string;
};

/** Directorio (people_directory) — SIN compensación y con minimización
 * de PII (sin cédula). */
export type TeamMember = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  hiredAt: string | null;
  position: string | null;
  area: string | null;
  active: boolean;
  contractEndDate: string | null;
  documents: EmployeeDocument[];
  annualLeaveDays: number;
  userId: string | null;
};

export type ContractType =
  | "termino_fijo"
  | "indefinido"
  | "prestacion_servicios"
  | "obra_labor";

/** Expediente completo (people_directory:write): PII, contractual,
 * personal y dotación — NADA de esto va al directorio general. El
 * salario NO está aquí: vive en people_compensation. */
export type EmployeeDetail = TeamMember & {
  identification: string | null;
  notes: string | null;
  // Contractual
  contractType: ContractType | null;
  workSchedule: string | null;
  eps: string | null;
  afp: string | null;
  arl: string | null;
  cajaCompensacion: string | null;
  // Personal — age SIEMPRE calculada desde birthDate, jamás almacenada.
  birthDate: string | null;
  age: number | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  bloodType: string | null;
  // Dotación
  shirtSize: string | null;
  pantsSize: string | null;
  shoeSize: string | null;
};

/** Compensación (people_compensation): salario base + pagos. */
export type EmployeeCompensation = {
  employeeId: string;
  fullName: string;
  identification: string | null;
  baseSalary: number | null;
  baseSalaryCurrency: string;
  payments: PayrollPayment[];
};

export type PayrollPayment = {
  id: string;
  employeeId: string;
  employeeName: string | null;
  period: string; // YYYY-MM
  amount: number;
  currencyCode: string;
  exchangeRate: number | null;
  paidAt: string;
  notes: string | null;
};

/** Punto de la serie de costo de nómina desde pagos registrados. */
export type PayrollCostPoint = {
  month: string; // YYYY-MM
  totalCop: number;
  payments: number;
};

export type PayrollCostSeries = {
  /** Etiqueta OBLIGATORIA en UI. */
  label: "nómina (pagos registrados)";
  points: PayrollCostPoint[];
};

export type LeaveRequestView = {
  id: string;
  employeeId: string;
  employeeName: string | null;
  type: LeaveType;
  startDate: string;
  endDate: string;
  /** DÍAS HÁBILES (L–V sin festivos CO) — misma unidad que
   * annualLeaveDays/remainingDays; ver LEAVE_DAY_UNIT. */
  days: number;
  reason: string | null;
  status: LeaveStatus;
  requestedBy: string;
  decidedBy: string | null;
  decidedAt: Date | null;
  decisionNote: string | null;
  createdAt: Date;
};

/** Saldo anual del empleado del guard — TODO en días hábiles CO
 * (LEAVE_DAY_UNIT), incluida annualLeaveDays. */
export type LeaveBalance = {
  annualLeaveDays: number;
  approvedDaysThisYear: number;
  remainingDays: number;
};
