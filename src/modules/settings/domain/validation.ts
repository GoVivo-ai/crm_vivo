import { z } from "zod";

export const integrationSchema = z.enum(["quickbooks", "meta_ads", "clickup"]);


export const testConnectionSchema = z.object({
  integration: integrationSchema,
});

export const clearCredentialsSchema = z.object({
  integration: integrationSchema,
});
