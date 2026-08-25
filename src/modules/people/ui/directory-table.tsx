import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { TeamMember } from "@/modules/people/domain/types";
import { MemberStatusBadge } from "@/modules/people/ui/labels";
import { ProfileForm } from "@/modules/people/ui/profile-form";

type DirectoryTableProps = {
  members: TeamMember[];
  /** management/admin editan expedientes. */
  canWrite: boolean;
  /** Hoy YYYY-MM-DD (server) para calcular vencimientos sin impurezas. */
  today: string;
};

function contractWarning(endDate: string | null, today: string) {
  if (!endDate) return null;
  const days = Math.floor(
    (Date.parse(endDate) - Date.parse(today)) / 86_400_000,
  );
  if (days < 0) return { label: "vencido", critical: true };
  if (days <= 60) return { label: `vence en ${days} d`, critical: false };
  return null;
}

export function DirectoryTable({
  members,
  canWrite,
  today,
}: DirectoryTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Persona</TableHead>
          <TableHead>Cargo</TableHead>
          <TableHead>Área</TableHead>
          <TableHead>Contrato</TableHead>
          <TableHead>Ingreso</TableHead>
          <TableHead>Estado</TableHead>
          {canWrite && <TableHead className="text-right">Expediente</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => {
          const warning = contractWarning(
            member.profile?.contractEndDate ?? null,
            today,
          );
          return (
            <TableRow key={member.alegraEmployeeId}>
              <TableCell>
                <p className="text-sm font-medium">{member.fullName}</p>
                {(member.email || member.phone) && (
                  <p className="truncate text-xs text-muted-foreground">
                    {[member.email, member.phone].filter(Boolean).join(" · ")}
                  </p>
                )}
              </TableCell>
              <TableCell className="text-sm">{member.position ?? "—"}</TableCell>
              <TableCell className="text-sm">{member.area ?? "—"}</TableCell>
              <TableCell className="text-sm">
                {member.profile?.contractType ?? "—"}
                {warning && (
                  <span
                    className={cn(
                      "ml-1.5 text-xs font-medium",
                      warning.critical
                        ? "text-health-critical"
                        : "text-health-warn",
                    )}
                  >
                    · {warning.label}
                  </span>
                )}
              </TableCell>
              <TableCell className="font-mono text-xs">
                {member.hiredAt ?? "—"}
              </TableCell>
              <TableCell>
                <MemberStatusBadge active={member.active} />
              </TableCell>
              {canWrite && (
                <TableCell className="text-right">
                  <ProfileForm member={member} />
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
