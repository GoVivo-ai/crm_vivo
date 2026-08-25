import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { TeamMember } from "@/modules/people/domain/types";
import { MemberStatusBadge } from "@/modules/people/ui/labels";

type DirectoryTableProps = {
  members: TeamMember[];
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

export function DirectoryTable({ members, today }: DirectoryTableProps) {
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
          <TableHead className="text-right">Expediente</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => {
          const warning = contractWarning(member.contractEndDate, today);
          return (
            <TableRow key={member.id}>
              <TableCell>
                <Link
                  href={`/people/${member.id}`}
                  className="text-sm font-medium hover:text-[#069B66]"
                >
                  {member.fullName}
                </Link>
                {(member.email || member.phone) && (
                  <p className="truncate text-xs text-muted-foreground">
                    {[member.email, member.phone].filter(Boolean).join(" · ")}
                  </p>
                )}
              </TableCell>
              <TableCell className="text-sm">{member.position ?? "—"}</TableCell>
              <TableCell className="text-sm">{member.area ?? "—"}</TableCell>
              <TableCell className="text-sm">
                {/* El tipo de contrato vive en el expediente (§14). */}
                {warning === null && "—"}
                {warning && (
                  <span
                    className={cn(
                      "ml-1.5 text-xs font-medium",
                      warning.critical
                        ? "text-health-critical"
                        : "text-health-warn",
                    )}
                  >
                    {warning.label}
                  </span>
                )}
              </TableCell>
              <TableCell className="font-mono text-xs">
                {member.hiredAt ?? "—"}
              </TableCell>
              <TableCell>
                <MemberStatusBadge active={member.active} />
              </TableCell>
              <TableCell className="text-right">
                <Link
                  href={`/people/${member.id}`}
                  className="text-xs font-extrabold text-[#069B66] hover:text-[#045C3D]"
                >
                  Abrir →
                </Link>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
