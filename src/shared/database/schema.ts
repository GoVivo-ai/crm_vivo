// Agregador único del schema para Drizzle. Cada módulo es dueño de su
// schema.ts; este archivo solo re-exporta para db.ts y drizzle-kit.
export * from "@/modules/identity/schema";
export * from "@/modules/crm/schema";
export * from "@/modules/clients/schema";
export * from "@/modules/finance/schema";
export * from "@/modules/marketing/schema";
export * from "@/modules/purchases/schema";
export * from "@/modules/people/schema";
export * from "@/modules/treasury/schema";
export * from "@/modules/settings/schema";
export * from "@/shared/database/sync-runs.schema";
