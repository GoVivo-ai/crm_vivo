import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LeaveStatus, LeaveType } from "@/modules/people/domain/types";

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  vacation: "Vacaciones",
  sick: "Incapacidad",
  personal: "Personal",
  unpaid: "No remunerada",
  other: "Otra",
};

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  requested: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
};

const LEAVE_STATUS_STYLES: Record<LeaveStatus, string> = {
  requested: "bg-health-warn/10 text-health-warn border-health-warn/30",
  approved: "bg-health-ok/10 text-health-ok border-health-ok/30",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
};

export function LeaveStatusBadge({ status }: { status: LeaveStatus }) {
  return (
    <Badge variant="outline" className={cn(LEAVE_STATUS_STYLES[status])}>
      {LEAVE_STATUS_LABELS[status]}
    </Badge>
  );
}

/** Badge de estado del empleado (campo `active` del directorio). */
export function MemberStatusBadge({ active }: { active: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        active
          ? "border-health-ok/30 bg-health-ok/10 text-health-ok"
          : "text-muted-foreground",
      )}
    >
      {active ? "Activo" : "Inactivo"}
    </Badge>
  );
}
