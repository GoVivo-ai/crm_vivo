import { z } from "zod";

export const employeeProfileInputSchema = z.object({
  alegraEmployeeId: z.string().trim().min(1).max(100),
  userId: z.uuid().nullish(),
  position: z.string().trim().max(200).nullish(),
  area: z.string().trim().max(200).nullish(),
  contractType: z.string().trim().max(100).nullish(),
  contractEndDate: z.iso.date().nullish(),
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
  notes: z.string().trim().max(5000).nullish(),
});
export type EmployeeProfileInput = z.infer<typeof employeeProfileInputSchema>;

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
