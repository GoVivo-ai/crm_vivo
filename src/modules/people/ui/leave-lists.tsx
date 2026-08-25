"use client";

import { Button } from "@/components/ui/button";
import type { LeaveRequestView } from "@/modules/people/domain/types";
import { decideLeaveRequest } from "@/modules/people/application/leave-actions";
import {
  LEAVE_TYPE_LABELS,
  LeaveStatusBadge,
} from "@/modules/people/ui/labels";
import { useActionSubmit } from "@/shared/ui/use-action-submit";

function RequestLine({
  request,
  unit,
  children,
}: {
  request: LeaveRequestView;
  /** LEAVE_DAY_UNIT del server — la unidad y el label viajan juntos. */
  unit: string;
  children?: React.ReactNode;
}) {
  return (
    <li className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          {request.employeeName ?? "—"} · {LEAVE_TYPE_LABELS[request.type]}
        </p>
        <p className="text-xs text-muted-foreground">
          {request.startDate} → {request.endDate} · {request.days} {unit}
          {request.reason ? ` · ${request.reason}` : ""}
          {request.decisionNote ? ` · Nota: ${request.decisionNote}` : ""}
        </p>
      </div>
      <LeaveStatusBadge status={request.status} />
      {children}
    </li>
  );
}

/** Mis solicitudes — solo lectura. */
export function MyLeaveList({
  requests,
  unit,
}: {
  requests: LeaveRequestView[];
  unit: string;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {requests.map((r) => (
        <RequestLine key={r.id} request={r} unit={unit} />
      ))}
    </ul>
  );
}

/** Bandeja de aprobación (management/admin); nadie decide la propia:
 * las solicitudes del propio aprobador salen sin botones. */
export function ApprovalsList({
  requests,
  currentUserId,
  unit,
}: {
  requests: LeaveRequestView[];
  currentUserId: string;
  unit: string;
}) {
  const { submit, pending } = useActionSubmit<unknown>();

  function decide(id: string, decision: "approved" | "rejected") {
    const decisionNote =
      decision === "rejected"
        ? window.prompt("Nota para quien solicitó (opcional):") || null
        : null;
    submit(
      () => decideLeaveRequest({ leaveRequestId: id, decision, decisionNote }),
      {
        successMessage:
          decision === "approved" ? "Solicitud aprobada" : "Solicitud rechazada",
      },
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {requests.map((r) => (
        <RequestLine key={r.id} request={r} unit={unit}>
          {r.status === "requested" && r.requestedBy === currentUserId ? (
            <span
              className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground"
              title="Otra persona debe decidir tu solicitud"
            >
              tuya
            </span>
          ) : r.status === "requested" ? (
            <span className="flex gap-1.5">
              <Button
                size="sm"
                disabled={pending}
                onClick={() => decide(r.id, "approved")}
              >
                Aprobar
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => decide(r.id, "rejected")}
              >
                Rechazar
              </Button>
            </span>
          ) : null}
        </RequestLine>
      ))}
    </ul>
  );
}
