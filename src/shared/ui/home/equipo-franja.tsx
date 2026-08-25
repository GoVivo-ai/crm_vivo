import Link from "next/link";
import type { TeamMember } from "@/modules/people/domain/types";
import { formatDayMonth } from "@/modules/people/ui/file/helpers";
import { Franja, type Veredicto } from "@/shared/ui/home/franja";
import { formatAccountingMoney } from "@/shared/ui/format";

type EquipoFranjaProps = {
  members: TeamMember[];
  /** null si el rol no ve compensación. */
  payrollThisMonthCop: number | null;
  pendingLeaveCount: number | null;
  today: string;
};

/** Franja Equipo: avatares + hechos del día + nómina + accionables. */
export function EquipoFranja({
  members,
  payrollThisMonthCop,
  pendingLeaveCount,
  today,
}: EquipoFranjaProps) {
  const active = members.filter((m) => m.active);
  const expiring = active.filter(
    (m) =>
      m.contractEndDate !== null &&
      (Date.parse(m.contractEndDate) - Date.parse(today)) / 86_400_000 <= 60,
  );

  // Próximo cumpleaños (sin año — minimización PII): el más cercano
  // hacia adelante, contando el cruce de año.
  const [, tm, td] = today.split("-").map(Number);
  const todayKey = tm * 100 + td;
  const nextBirthday = active
    .filter((m) => m.birthDayMonth !== null)
    .map((m) => {
      const b = m.birthDayMonth!;
      const key = b.month * 100 + b.day;
      return { m, b, order: key >= todayKey ? key : key + 1300 };
    })
    .sort((a, b) => a.order - b.order)[0];

  const verdict: Veredicto =
    members.length === 0
      ? "sindatos"
      : (pendingLeaveCount ?? 0) > 0 || expiring.length > 0
        ? "atencion"
        : "bien";

  return (
    <Franja
      dot="#011640"
      label="Equipo"
      verdict={verdict}
      href="/people"
      linkLabel="Abrir Equipo"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center">
            {active.slice(0, 6).map((m, i) => (
              <span
                key={m.id}
                title={m.fullName}
                className="grid size-8 place-items-center rounded-full border-2 border-card bg-gradient-to-br from-[#04D98B] to-[#F2E205] font-[family-name:var(--font-display)] text-[11px] font-extrabold text-[#011640]"
                style={{ marginLeft: i === 0 ? 0 : -8 }}
              >
                {m.fullName
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")}
              </span>
            ))}
            {active.length > 6 && (
              <span className="ml-1.5 text-xs font-bold text-muted-foreground">
                +{active.length - 6}
              </span>
            )}
          </div>
          <p className="mt-2 text-[11.5px] font-semibold text-muted-foreground">
            {active.length} personas activas
          </p>
        </div>
        {payrollThisMonthCop !== null && (
          <div className="text-right">
            <p className="text-[10px] font-bold tracking-[0.1em] text-muted-foreground uppercase">
              Nómina del mes
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-[26px] leading-none font-extrabold tabular-nums">
              {formatAccountingMoney(payrollThisMonthCop)}
            </p>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        {(pendingLeaveCount ?? 0) > 0 && (
          <Link
            href="/people/leave"
            className="text-xs font-extrabold text-health-warn hover:underline"
          >
            Aprobar {pendingLeaveCount} ausencia
            {pendingLeaveCount === 1 ? "" : "s"} pendiente
            {pendingLeaveCount === 1 ? "" : "s"} →
          </Link>
        )}
        {expiring.length > 0 && (
          <Link
            href="/people"
            className="text-xs font-extrabold text-health-warn hover:underline"
          >
            Renovar {expiring.length} contrato
            {expiring.length === 1 ? "" : "s"} por vencer →
          </Link>
        )}
        {(pendingLeaveCount ?? 0) === 0 && expiring.length === 0 && (
          <p className="text-[11.5px] font-semibold text-muted-foreground">
            Sin pendientes de gestión hoy.
          </p>
        )}
        {nextBirthday && (
          <p className="text-[11.5px] font-semibold text-muted-foreground">
            {nextBirthday.b.month === tm && nextBirthday.b.day === td
              ? `Hoy cumple años ${nextBirthday.m.fullName}.`
              : `Próximo cumpleaños: ${nextBirthday.m.fullName} · ${formatDayMonth(nextBirthday.b)}`}
          </p>
        )}
      </div>
    </Franja>
  );
}
