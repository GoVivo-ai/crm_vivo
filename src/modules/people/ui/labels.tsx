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

// §15.2: estado SIEMPRE badge de tinta — jamás outline.
const LEAVE_STATUS_STYLES: Record<LeaveStatus, string> = {
  requested: "bg-[#FBF7D9] text-[#8C7A0A]",
  approved: "bg-[#E6F9F1] text-[#069B66]",
  rejected: "bg-[#FAEAEA] text-[#C93A3A]",
};

export function LeaveStatusBadge({ status }: { status: LeaveStatus }) {
  return (
    <Badge
      className={cn(
        "rounded-full border-transparent font-extrabold",
        LEAVE_STATUS_STYLES[status],
      )}
    >
      {LEAVE_STATUS_LABELS[status]}
    </Badge>
  );
}

/** Badge de estado del empleado (campo `active` del directorio). */
export function MemberStatusBadge({ active }: { active: boolean }) {
  return (
    <Badge
      className={cn(
        "rounded-full border-transparent font-extrabold",
        active
          ? "bg-[#E6F9F1] text-[#069B66]"
          : "bg-[#EEF1F6] text-[#5A6B85]",
      )}
    >
      {active ? "Activo" : "Inactivo"}
    </Badge>
  );
}
