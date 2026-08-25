import { alegraToolsGet } from "@/integrations/alegra/reports-client";
import type {
  AlegraBankAccount,
  AlegraBankTransaction,
  AlegraEmployee,
} from "@/integrations/alegra/erp-types";

// Banks y payroll viven en el backend de tools (mcp.alegra.com/tools),
// igual que reports — misma Basic Auth. Shapes validados vía MCP.
// PENDIENTE E2E: confirmar el nombre exacto del tool de employees
// (convención doble guion bajo, como reports__/bills__).

/** Cuentas bancarias con saldo (mainCurrencyBalance normalizado a COP). */
export async function fetchBankAccounts(): Promise<AlegraBankAccount[]> {
  const body = await alegraToolsGet<{
    data?: AlegraBankAccount[];
  }>("banks__getBanks", { includeBalance: "true", metadata: "true" });
  return body.data ?? [];
}

/** Página de movimientos de una cuenta (máx 30 por página, como invoices). */
export async function fetchBankTransactions(
  bankAccountId: string,
  start: number,
  limit = 30,
): Promise<AlegraBankTransaction[]> {
  const body = await alegraToolsGet<{
    data?: AlegraBankTransaction[];
  }>("banks__getTransactions", {
    bankAccountId,
    start: String(start),
    limit: String(limit),
  });
  return body.data ?? [];
}

/** Empleados de nómina (el mapper filtra las filas fantasma con names null). */
export async function fetchEmployees(): Promise<AlegraEmployee[]> {
  const body = await alegraToolsGet<{
    employees?: AlegraEmployee[];
  }>("payroll__list-employees", { limit: "100" });
  return body.employees ?? [];
}
