import { resilientFetch } from "@/shared/http/resilient-fetch";

// Los reportes P&L y cashflow NO están en api.alegra.com/api/v1: viven en
// el backend de reportes https://mcp.alegra.com/tools/* con la misma Basic
// Auth (email:token). Shapes tomados de developer.alegra.com (2026-08).
// PENDIENTE al tener credenciales: confirmar GET+query vs body (el OpenAPI
// declara GET con requestBody, que fetch no permite).
const REPORTS_BASE_URL = "https://mcp.alegra.com/tools";

/** Nodo del árbol del Estado de Resultados. */
export interface PnlNode {
  name: string;
  section?: number;
  type: "income" | "cost" | "productionCost" | "expense";
  balance: string;
  contableCode?: string;
  children?: PnlNode[];
}

/** Sección del flujo de caja (5 fijas) con desglose mensual. */
export interface CashFlowSection {
  id:
    | "INITIAL_CASH_AND_BANKS_BALANCE"
    | "INCOME"
    | "EXPENSES"
    | "BALANCE_OF_THE_PERIOD"
    | "FINAL_BALANCE_IN_CASH_AND_BANKS";
  name: string;
  periods: { fromDate: string; toDate: string; balance: string }[];
}

function authHeader(): string {
  const email = process.env.ALEGRA_EMAIL;
  const token = process.env.ALEGRA_API_TOKEN;
  if (!email || !token) {
    throw new Error("Faltan ALEGRA_EMAIL / ALEGRA_API_TOKEN");
  }
  return `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`;
}

async function reportsGet<T>(
  tool: string,
  params: Record<string, string>,
): Promise<T> {
  const url = new URL(`${REPORTS_BASE_URL}/${tool}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const response = await resilientFetch(url.toString(), {
    headers: { Authorization: authHeader(), Accept: "application/json" },
  });
  return (await response.json()) as T;
}

export function fetchProfitAndLoss(
  from: string,
  to: string,
): Promise<PnlNode[]> {
  return reportsGet<PnlNode[]>("reports__getProfitAndLoss", { from, to });
}

export function fetchCashFlow(
  dateFrom: string,
  dateTo: string,
): Promise<CashFlowSection[]> {
  return reportsGet<CashFlowSection[]>("reports__getCashFlow", {
    dateFrom,
    dateTo,
  });
}

/** Suma balances del árbol por tipo de cuenta (raíces, no dobles conteos). */
export function summarizePnl(nodes: PnlNode[]): Record<string, number> {
  const totals: Record<string, number> = {
    income: 0,
    cost: 0,
    productionCost: 0,
    expense: 0,
  };
  for (const node of nodes) {
    totals[node.type] = (totals[node.type] ?? 0) + Number(node.balance || 0);
  }
  totals.netIncome =
    totals.income - totals.cost - totals.productionCost - totals.expense;
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
