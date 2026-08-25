// Tipos ERP (F6-F8) — shapes validados contra la API real vía MCP 2026-08-25.
import type { AlegraClientRef } from "@/integrations/alegra/types";

/** Bill (factura de proveedor), payload simple=true de GET /v1/bills. */
export interface AlegraBill {
  id: string | number;
  date?: string;
  dueDate?: string;
  status?: string;
  numberTemplate?: { fullNumber?: string; number?: string };
  provider?: AlegraClientRef;
  total?: number;
  totalPaid?: number;
  balance?: number;
  costCenter?: { id?: string | number; name?: string } | null;
}

/**
 * Cuenta bancaria de banks__getBanks (includeBalance=true).
 * mainCurrencyBalance YA viene normalizado a COP para cuentas USD.
 */
export interface AlegraBankAccount {
  id: string | number;
  name: string;
  number?: string | null;
  type: "bank" | "cash" | "credit-card";
  status: "active" | "inactive";
  balance?: number;
  mainCurrencyBalance?: number;
  currency?: { currencyCode: string; exchangeRate?: number };
}

/** Movimiento de banks__getTransactions (por cuenta). */
export interface AlegraBankTransaction {
  id: string | number;
  date?: string;
  amount?: number;
  type?: "in" | "out";
  status?: string;
  movementType?: string;
  client?: { id?: string | number; name?: string; identification?: string } | null;
  /** Texto legible, ej. "Facturas: FE10399". */
  associations?: string;
  anotation?: string | null;
}

/**
 * Empleado de payroll list-employees. OJO: el id es un ULID string
 * ("01J2YFG7..."), no numérico; y la lista real trae ~21 filas fantasma
 * con names/salary null — el mapper las filtra (criterio: names != null).
 */
export interface AlegraEmployee {
  id: string;
  names?: string | null;
  lastNames?: string | null;
  identification?: string | null;
  position?: string | null;
  area?: string | null;
  salary?: number | null;
  status?: string | null;
  email?: string | null;
  contract?: unknown;
}
