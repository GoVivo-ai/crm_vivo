import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Origen de un registro del ERP. 'manual' = capturado en la app
 * (editable/borrable); 'quickbooks' = sincronizado (solo lectura).
 */
export const recordSourceEnum = pgEnum("record_source", [
  "manual",
  "quickbooks",
]);
