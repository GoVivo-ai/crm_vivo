import { resilientFetch } from "@/shared/http/resilient-fetch";
import { alegraAuthHeader } from "@/integrations/alegra/alegra-client";

// Los reportes P&L y cashflow NO están en api.alegra.com/api/v1: viven en
// el backend de reportes https://mcp.alegra.com/tools/* con la misma Basic
// Auth (email:token). Shapes tomados de developer.alegra.com (2026-08).
// PENDIENTE al tener credenciales: confirmar GET+query vs body (el OpenAPI
// declara GET con requestBody, que fetch no permite).
const REPORTS_BASE_URL = "https://mcp.alegra.com/tools";

/**
 * Nodo del Estado de Resultados (shape REAL capturado vía MCP 2026-08-25;
 * más rico que el ejemplo de la doc). El array raíz intercala cuentas
 * (type/balance/isRoot) con filas de resumen isUtility ("Utilidad bruta",
 * "Pérdida neta"...) e isTotal por sección. `balance` de cuentas es la
 * MAGNITUD (positiva); el signo va en nature (credit/debit). En datos
 * reales "Costos" llega como type "expense" (no "cost").
 */
export interface PnlNode {
  name: string;
  id?: string;
  code?: string | null;
  section?: number;
  type?: "income" | "cost" | "productionCost" | "expense";
  nature?: "credit" | "debit";
  balance?: string;
  isRoot?: boolean;
  isUtility?: boolean;
  isTotal?: boolean;
  level?: number;
  periods?: { from: string; to: string; balance: string | number }[];
  children?: PnlNode[];
}

/**
 * Sección del flujo de caja (5 fijas, shape validado vía MCP). El balance
 * top-level de cada sección ya es el total; `children` desglosa por
 * categoría contable (incluye partidas sin movimiento de efectivo).
 */
export interface CashFlowSection {
  id: string;
  name: string;
  periods: { fromDate: string; toDate: string; balance: string }[];
  children?: CashFlowSection[];
}

/**
 * GET genérico contra el backend de tools de Alegra (mcp.alegra.com/tools).
 * Lo usan también banks y payroll (mismo host y Basic Auth que reports).
 */
export async function alegraToolsGet<T>(
  tool: string,
  params: Record<string, string>,
): Promise<T> {
  const url = new URL(`${REPORTS_BASE_URL}/${tool}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const response = await resilientFetch(url.toString(), {
    headers: {
      Authorization: await alegraAuthHeader(),
      Accept: "application/json",
    },
  });
  return (await response.json()) as T;
}

export function fetchProfitAndLoss(
  from: string,
  to: string,
): Promise<PnlNode[]> {
  return alegraToolsGet<PnlNode[]>("reports__getProfitAndLoss", { from, to });
}

export function fetchCashFlow(
  dateFrom: string,
  dateTo: string,
): Promise<CashFlowSection[]> {
  return alegraToolsGet<CashFlowSection[]>("reports__getCashFlow", {
    dateFrom,
    dateTo,
  });
}

/**
 * Totales del P&L: suma solo cuentas raíz por tipo (magnitudes) y toma la
 * utilidad neta de la fila isUtility de la última sección (la cifra
 * autoritativa de contabilidad), con fallback a income − costos − gastos.
 */
export function summarizePnl(nodes: PnlNode[]): Record<string, number> {
  const totals: Record<string, number> = {
    income: 0,
    cost: 0,
    productionCost: 0,
    expense: 0,
  };
  for (const node of nodes) {
    if (!node.type || node.isUtility || node.isTotal) continue;
    totals[node.type] = (totals[node.type] ?? 0) + Number(node.balance || 0);
  }

  const utilityRows = nodes.filter((n) => n.isUtility && n.periods?.length);
  const lastUtility = utilityRows[utilityRows.length - 1];
  const reported = lastUtility?.periods?.[0]?.balance;
  totals.netIncome =
    reported !== undefined
      ? Number(reported)
      : totals.income - totals.cost - totals.productionCost - totals.expense;
  return totals;
}

/** Aplana las 5 secciones a un resumen {income, expenses, finalBalance...}. */
export function summarizeCashFlow(
  sections: CashFlowSection[],
): Record<string, number> {
  const sum = (id: CashFlowSection["id"]) =>
    sections
      .find((s) => s.id === id)
      ?.periods.reduce((acc, p) => acc + Number(p.balance || 0), 0) ?? 0;
  const last = (id: CashFlowSection["id"]) => {
    const periods = sections.find((s) => s.id === id)?.periods ?? [];
    return Number(periods[periods.length - 1]?.balance ?? 0);
  };
  return {
    initialBalance: Number(
      sections.find((s) => s.id === "INITIAL_CASH_AND_BANKS_BALANCE")
        ?.periods[0]?.balance ?? 0,
    ),
    income: sum("INCOME"),
    expenses: sum("EXPENSES"),
    periodBalance: sum("BALANCE_OF_THE_PERIOD"),
    finalBalance: last("FINAL_BALANCE_IN_CASH_AND_BANKS"),
  };
}
