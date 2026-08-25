import Link from "next/link";
import type {
  LeaveBalance,
  LeaveRequestView,
} from "@/modules/people/domain/types";
import { LEAVE_TYPE_LABELS } from "@/modules/people/ui/labels";
import { FileCard } from "./bits";
import { formatIsoDate } from "./helpers";

/** Card Ausencias (§14): saldo del año + próxima ausencia. */
export function LeaveCard({
  balance,
  requests,
  unit,
  today,
  year,
}: {
  balance: LeaveBalance | null;
  requests: LeaveRequestView[];
  /** LEAVE_DAY_UNIT del server. */
  unit: string;
  today: string;
  year: string;
}) {
  const next = requests
    .filter((r) => r.status === "approved" && r.startDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
  const pending = requests.find(
    (r) => r.status === "requested" && r.startDate >= today,
  );

  return (
    <FileCard
      title="Ausencias"
      right={
        <Link
          href="/people/leave"
          className="ml-auto text-xs font-bold text-[#069B66] hover:text-[#045C3D]"
        >
          Ver todas →
        </Link>
      }
    >
      <div className="flex flex-col gap-2.5 px-5 pt-2.5 pb-4">
        {balance ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-bold">Saldo {year}</span>
              <span className="font-[family-name:var(--font-display)] text-sm font-extrabold text-[#011640]">
                {balance.remainingDays} de {balance.annualLeaveDays} {unit}
              </span>
            </div>
            <div
              className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-[#EEF1F6]"
              role="img"
              aria-label={`Usados ${balance.approvedDaysThisYear}, disponibles ${balance.remainingDays} de ${balance.annualLeaveDays} ${unit}`}
            >
              <div
                className="bg-[#011640]"
                style={{
                  width: `${Math.min(100, (balance.approvedDaysThisYear / Math.max(1, balance.annualLeaveDays)) * 100)}%`,
                }}
              />
              <div className="flex-1 bg-[#04D98B]" />
            </div>
          </>
        ) : (
          <p className="text-xs font-semibold text-muted-foreground">
            Saldo no disponible para tu rol.
          </p>
        )}
        <p className="text-xs font-semibold text-muted-foreground">
          {next
            ? `Próxima: ${LEAVE_TYPE_LABELS[next.type].toLowerCase()} ${formatIsoDate(next.startDate)} → ${formatIsoDate(next.endDate)}`
            : pending
              ? `Solicitud pendiente: ${LEAVE_TYPE_LABELS[pending.type].toLowerCase()} ${formatIsoDate(pending.startDate)} → ${formatIsoDate(pending.endDate)}`
              : "Sin ausencias próximas."}
        </p>
      </div>
    </FileCard>
  );
}
