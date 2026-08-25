import { z } from "zod";

export const employeeInputSchema = z.object({
  fullName: z.string().trim().min(1, "El nombre es obligatorio").max(200),
  identification: z.string().trim().max(50).nullish(),
  email: z.email("Email inválido").nullish().or(z.literal("")),
  phone: z.string().trim().max(50).nullish(),
  hiredAt: z.iso.date().nullish(),
  position: z.string().trim().max(200).nullish(),
  area: z.string().trim().max(200).nullish(),
  active: z.boolean().default(true),
  // Contractual
  contractType: z
    .enum(["termino_fijo", "indefinido", "prestacion_servicios", "obra_labor"])
    .nullish(),
  contractEndDate: z.iso.date().nullish(),
  workSchedule: z.string().trim().max(200).nullish(),
  eps: z.string().trim().max(100).nullish(),
  afp: z.string().trim().max(100).nullish(),
  arl: z.string().trim().max(100).nullish(),
  cajaCompensacion: z.string().trim().max(100).nullish(),
  // Personal
  birthDate: z.iso.date().nullish(),
  address: z.string().trim().max(300).nullish(),
  emergencyContactName: z.string().trim().max(200).nullish(),
  emergencyContactPhone: z.string().trim().max(50).nullish(),
  bloodType: z.string().trim().max(5).nullish(),
  // Dotación (máx 8 chars por directriz)
  shirtSize: z.string().trim().max(8).nullish(),
  pantsSize: z.string().trim().max(8).nullish(),
  shoeSize: z.string().trim().max(8).nullish(),
  documents: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(200),
        url: z.url(),
        expiresAt: z.iso.date().optional(),
      }),
    )
    .max(50)
    .nullish(),
  annualLeaveDays: z.number().int().min(0).max(60).default(15),
  userId: z.uuid().nullish(),
  notes: z.string().trim().max(5000).nullish(),
}).refine(
  (v) => {
    if (!v.birthDate) return true;
    const cutoff = new Date();
    cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 16);
    return Date.parse(v.birthDate) <= cutoff.getTime();
  },
  { message: "La fecha de nacimiento debe corresponder a mayor de 16 años", path: ["birthDate"] },
);
export type EmployeeInput = z.infer<typeof employeeInputSchema>;

export const payrollPaymentInputSchema = z
  .object({
    employeeId: z.uuid(),
    period: z.string().regex(/^\d{4}-\d{2}$/, "Periodo en formato YYYY-MM"),
    amount: z.number().positive("El monto debe ser mayor a 0"),
    currencyCode: z.string().length(3).default("COP"),
    exchangeRate: z.number().positive().nullish(),
    paidAt: z.iso.date(),
    notes: z.string().trim().max(2000).nullish(),
  })
  .refine((v) => v.currencyCode === "COP" || v.exchangeRate != null, {
    message: "Indica la TRM para monedas distintas de COP",
    path: ["exchangeRate"],
  });
export type PayrollPaymentInput = z.infer<typeof payrollPaymentInputSchema>;

export const setBaseSalarySchema = z.object({
  employeeId: z.uuid(),
  baseSalary: z.number().nonnegative().nullable(),
  currency: z.string().length(3).default("COP"),
});

export const leaveRequestInputSchema = z
  .object({
    type: z.enum(["vacation", "sick", "personal", "unpaid", "other"]),
    startDate: z.iso.date(),
    endDate: z.iso.date(),
    reason: z.string().trim().max(2000).nullish(),
  })
  .refine((v) => v.startDate <= v.endDate, {
    message: "El rango de fechas es inválido",
    path: ["startDate"],
  });
export type LeaveRequestInput = z.infer<typeof leaveRequestInputSchema>;

export const decideLeaveSchema = z.object({
  leaveRequestId: z.uuid(),
  decision: z.enum(["approved", "rejected"]),
  decisionNote: z.string().trim().max(2000).nullish(),
});
export type DecideLeaveInput = z.infer<typeof decideLeaveSchema>;
