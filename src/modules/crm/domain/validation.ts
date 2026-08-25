import { z } from "zod";

const optionalTrimmed = z
  .string()
  .trim()
  .max(500)
  .transform((v) => (v === "" ? null : v))
  .nullish()
  .transform((v) => v ?? null);

export const contactInputSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(200),
  email: z.email("Email inválido").nullish().or(z.literal("")),
  phone: optionalTrimmed,
  jobTitle: optionalTrimmed,
  accountId: z.uuid().nullish(),
  ownerId: z.uuid().nullish(),
  notes: z.string().trim().max(5000).nullish(),
});
export type ContactInput = z.infer<typeof contactInputSchema>;

export const accountInputSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(200),
  nit: optionalTrimmed,
  industry: optionalTrimmed,
  website: optionalTrimmed,
  status: z.enum(["prospect", "active", "paused", "churned"]).default("prospect"),
  ownerId: z.uuid().nullish(),
  alegraContactId: optionalTrimmed,
  clickupFolderId: optionalTrimmed,
  notes: z.string().trim().max(5000).nullish(),
});
export type AccountInput = z.infer<typeof accountInputSchema>;

export const dealInputSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio").max(200),
  accountId: z.uuid("Cuenta inválida"),
  contactId: z.uuid().nullish(),
  stageId: z.uuid("Etapa inválida"),
  ownerId: z.uuid().nullish(),
  amount: z.number().nonnegative().nullish(),
  currency: z.string().length(3).default("COP"),
  expectedCloseDate: z.iso.date().nullish(),
});
export type DealInput = z.infer<typeof dealInputSchema>;

export const moveDealSchema = z.object({
  dealId: z.uuid(),
  stageId: z.uuid(),
  position: z.number().int().nonnegative(),
});
export type MoveDealInput = z.infer<typeof moveDealSchema>;

export const activityInputSchema = z
  .object({
    type: z.enum(["call", "meeting", "email", "task", "note"]),
    subject: z.string().trim().min(1, "El asunto es obligatorio").max(300),
    content: z.string().trim().max(10000).nullish(),
    dueDate: z.coerce.date().nullish(),
    dealId: z.uuid().nullish(),
    contactId: z.uuid().nullish(),
    accountId: z.uuid().nullish(),
  })
  .refine((v) => v.dealId || v.contactId || v.accountId, {
    message: "La actividad debe asociarse a un deal, contacto o cuenta",
    path: ["dealId"],
  });
export type ActivityInput = z.infer<typeof activityInputSchema>;

export const proposalInputSchema = z.object({
  dealId: z.uuid(),
  title: z.string().trim().min(1, "El título es obligatorio").max(200),
  url: z.url("URL inválida").nullish().or(z.literal("")),
  status: z.enum(["draft", "sent", "accepted", "rejected"]).default("draft"),
  amount: z.number().nonnegative().nullish(),
});
export type ProposalInput = z.infer<typeof proposalInputSchema>;

export const listFilterSchema = z.object({
  ownerId: z.uuid().nullish(),
  search: z.string().trim().max(200).nullish(),
});
export type ListFilter = z.infer<typeof listFilterSchema>;
