"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { LeaveRequestView } from "@/modules/people/domain/types";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
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

/** Rechazo con nota (§12.4) — sustituye al window.prompt. */
function RejectLeaveDialog({
  request,
  pending,
  onReject,
}: {
  request: LeaveRequestView;
  pending: boolean;
  onReject: (note: string | null) => void;
}) {
  const [note, setNote] = useState("");
  return (
    <ConfirmDialog
      trigger={
        <Button size="sm" variant="outline" disabled={pending}>
          Rechazar
        </Button>
      }
      title={`¿Rechazar la solicitud de ${request.employeeName ?? "esta persona"}?`}
      body={`${request.startDate} → ${request.endDate}. Quien solicitó verá el rechazo y tu nota.`}
      confirmLabel="Rechazar solicitud"
      objectName={request.employeeName ?? undefined}
      pending={pending}
      onConfirm={() => onReject(note.trim() || null)}
    >
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Nota para quien solicitó (opcional)"
      />
    </ConfirmDialog>
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

  function decide(
    id: string,
    decision: "approved" | "rejected",
    decisionNote: string | null = null,
  ) {
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
              <RejectLeaveDialog
                request={r}
                pending={pending}
                onReject={(note) => decide(r.id, "rejected", note)}
              />
            </span>
          ) : null}
        </RequestLine>
      ))}
    </ul>
  );
}
