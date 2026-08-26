import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  AccountStatus,
  ActivityType,
  ProposalStatus,
} from "@/modules/crm/domain/types";

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  prospect: "Prospecto",
  active: "Activo",
  paused: "En pausa",
  churned: "Perdido",
};

// §15.2: estado SIEMPRE badge de tinta (§6) — jamás outline.
const ACCOUNT_STATUS_STYLES: Record<AccountStatus, string> = {
  prospect: "bg-[#E8F0FB] text-[#1E5FBF]",
  active: "bg-[#E6F9F1] text-[#069B66]",
  paused: "bg-[#FBF7D9] text-[#8C7A0A]",
  churned: "bg-[#FAEAEA] text-[#C93A3A]",
};

export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  return (
    <Badge
      className={cn(
        "rounded-full border-transparent font-extrabold",
        ACCOUNT_STATUS_STYLES[status],
      )}
    >
      {ACCOUNT_STATUS_LABELS[status]}
    </Badge>
  );
}

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  draft: "Borrador",
  sent: "Enviada",
  accepted: "Aceptada",
  rejected: "Rechazada",
};

const PROPOSAL_STATUS_STYLES: Record<ProposalStatus, string> = {
  draft: "bg-secondary text-secondary-foreground",
  sent: "bg-module-clients/10 text-module-clients border-module-clients/30",
  accepted: "bg-health-ok/10 text-health-ok border-health-ok/30",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
};

export function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  return (
    <Badge variant="outline" className={cn(PROPOSAL_STATUS_STYLES[status])}>
      {PROPOSAL_STATUS_LABELS[status]}
    </Badge>
  );
}

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  call: "Llamada",
  meeting: "Reunión",
  email: "Correo",
  task: "Tarea",
  note: "Nota",
};
