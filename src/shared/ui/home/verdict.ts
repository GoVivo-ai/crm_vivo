export type GlobalVerdict = {
  word: "sana" | "estable" | "en riesgo";
  tone: "ok" | "warn" | "critical";
  phrase: string;
};

export type VerdictInputs = {
  cashCop: number | null;
  coverageMonths: number | null;
  netIncomeCop: number | null;
  overdueCop: number;
  riskyProjects: number;
  pendingLeave: number;
  expiringContracts: number;
};

/** Veredicto global del negocio, calculado de los datos — nunca fijo. */
export function computeVerdict(i: VerdictInputs): GlobalVerdict {
  const critical =
    (i.cashCop !== null && i.cashCop < 0) ||
    (i.coverageMonths !== null && i.coverageMonths < 1);
  const warnings: string[] = [];

  if (i.overdueCop > 0) warnings.push("cartera vencida por cobrar");
  if (i.riskyProjects > 0)
    warnings.push(
      `${i.riskyProjects} proyecto${i.riskyProjects === 1 ? "" : "s"} en riesgo`,
    );
  if (i.pendingLeave > 0)
    warnings.push(
      `${i.pendingLeave} ausencia${i.pendingLeave === 1 ? "" : "s"} por aprobar`,
    );
  if (i.expiringContracts > 0)
    warnings.push(
      `${i.expiringContracts} contrato${i.expiringContracts === 1 ? "" : "s"} por vencer`,
    );
  if (i.netIncomeCop !== null && i.netIncomeCop < 0)
    warnings.push("el mes va en pérdida");

  const word: GlobalVerdict["word"] = critical
    ? "en riesgo"
    : warnings.length > 1 || (i.netIncomeCop !== null && i.netIncomeCop < 0)
      ? "estable"
      : "sana";

  const strengths: string[] = [];
  if (i.coverageMonths !== null && i.coverageMonths >= 1)
    strengths.push(
      `Caja para ${i.coverageMonths.toFixed(1).replace(".", ",")} meses`,
    );
  if (i.netIncomeCop !== null && i.netIncomeCop > 0)
    strengths.push("margen positivo");

  const phrase =
    warnings.length === 0
      ? strengths.length > 0
        ? `${strengths.join(" y ")}. Nada pide gestión urgente hoy.`
        : "Registra tus primeros datos para ver el estado real del negocio."
      : `${strengths.length > 0 ? `${strengths.join(" y ")}. ` : ""}${
          warnings.length === 1 ? "Pide gestión hoy" : "Piden gestión hoy"
        }: ${warnings.join(", ")}.`;

  return {
    word,
    tone: critical ? "critical" : word === "sana" ? "ok" : "warn",
    phrase,
  };
}
