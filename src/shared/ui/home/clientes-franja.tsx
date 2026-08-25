import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ClientHealthChip } from "@/modules/clients/application/clients-health-action";
import type { ClientsSummary } from "@/modules/clients/application/clients-summary-action";
import { Franja, type Veredicto } from "@/shared/ui/home/franja";
import { formatAccountingMoney } from "@/shared/ui/format";

const BUCKET_STYLES: Record<ClientHealthChip["bucket"], string> = {
  green: "bg-health-ok/10 text-health-ok",
  yellow: "bg-health-warn/10 text-health-warn",
  red: "bg-health-critical/10 text-health-critical",
};

// marginCop puede faltar por rol (sin profitability:read) o por falta de
// señal — el tooltip solo agrega la cifra cuando viaja, sin inferir nada.
function chipTitle(chip: ClientHealthChip): string {
  const base =
    "Salud operativa de sus proyectos, ajustada por rentabilidad de los últimos 3 meses";
  return chip.marginCop !== undefined
    ? `${base}. Margen: ${formatAccountingMoney(chip.marginCop)}`
    : `${base}.`;
}

/** Franja Clientes: semáforo POR CUENTA (nombre + bucket) + accionable. */
export function ClientesFranja({
  summary,
  chips,
}: {
  summary: ClientsSummary;
  chips: ClientHealthChip[];
}) {
  const red = chips.filter((c) => c.bucket === "red");
  const yellow = chips.filter((c) => c.bucket === "yellow");
  const green = chips.filter((c) => c.bucket === "green");

  // Peor cuenta: la roja con menor margen conocido; si no, la primera roja.
  const worst =
    red
      .filter((c) => c.marginCop !== undefined)
      .sort((a, b) => (a.marginCop ?? 0) - (b.marginCop ?? 0))[0] ?? red[0];

  const verdict: Veredicto =
    chips.length === 0 && summary.activeClients === 0
      ? "sindatos"
      : red.length > 0
        ? "problema"
        : yellow.length > 0
          ? "atencion"
          : "bien";

  return (
    <Franja
      dot="var(--module-clients)"
      label="Clientes · Operación"
      verdict={verdict}
      href="/clients"
      linkLabel="Abrir Clientes"
    >
      <p className="font-[family-name:var(--font-display)] text-[26px] leading-none font-extrabold tabular-nums">
        {summary.activeClients}{" "}
        <span className="ml-1.5 text-sm font-bold text-muted-foreground">
          clientes activos
        </span>
      </p>

      {chips.length > 0 ? (
        <>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[...red, ...yellow, ...green].map((chip) => (
              <Link
                key={chip.accountId}
                href={`/clients/${chip.accountId}`}
                title={chipTitle(chip)}
                className={cn(
                  "inline-flex max-w-44 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-extrabold hover:opacity-80",
                  BUCKET_STYLES[chip.bucket],
                )}
              >
                <span className="size-1.5 shrink-0 rounded-full bg-current" />
                <span className="truncate">{chip.accountName}</span>
              </Link>
            ))}
          </div>
          <p className="mt-2 text-[11.5px] font-semibold text-muted-foreground">
            {green.length} sana{green.length === 1 ? "" : "s"} · {yellow.length}{" "}
            atención · {red.length} riesgo
          </p>
        </>
      ) : (
        <p className="mt-3 text-[11.5px] font-semibold text-muted-foreground">
          Sin cuentas activas con proyectos todavía.
        </p>
      )}

      {worst ? (
        <Link
          href={`/clients/${worst.accountId}`}
          className="mt-2.5 inline-block text-xs font-extrabold text-health-critical hover:underline"
        >
          Rescatar {worst.accountName} →
        </Link>
      ) : yellow.length > 0 ? (
        <Link
          href={`/clients/${yellow[0].accountId}`}
          className="mt-2.5 inline-block text-xs font-extrabold text-health-warn hover:underline"
        >
          Revisar {yellow[0].accountName} →
        </Link>
      ) : null}
    </Franja>
  );
}
