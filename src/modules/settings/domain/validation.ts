import { z } from "zod";

export const integrationSchema = z.enum(["alegra", "meta_ads", "clickup"]);

/** Carga manual: SOLO Alegra (su API no ofrece OAuth — email+token).
 * meta_ads y clickup se conectan por OAuth (/api/oauth/[provider]/start). */
export const credentialsInputSchema = z.discriminatedUnion("integration", [
  z.object({
    integration: z.literal("alegra"),
    credentials: z.object({
      email: z.email("Email inválido"),
      token: z.string().trim().min(8, "Token demasiado corto").max(500),
    }),
  }),
]);
export type CredentialsInput = z.infer<typeof credentialsInputSchema>;

export const testConnectionSchema = z.object({
  integration: integrationSchema,
  /** Si vienen, se prueban SIN guardar; si no, se prueban las guardadas. */
  credentials: z.record(z.string(), z.string()).nullish(),
});

export const clearCredentialsSchema = z.object({
  integration: integrationSchema,
});
