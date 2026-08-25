import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getLeaveBalanceFor } from "@/modules/people/application/leave-actions";
import {
  getEmployeeCompensation,
  getEmployeeDetail,
  getTeamDirectory,
} from "@/modules/people/application/team-actions";
import { MemberStatusBadge } from "@/modules/people/ui/labels";
import { LEAVE_DAY_UNIT } from "@/modules/people/domain/leave-days";
import { ChecklistCard } from "@/modules/people/ui/file/checklist-card";
import { CompensationCard } from "@/modules/people/ui/file/compensation-card";
import { ContractualCard } from "@/modules/people/ui/file/contractual-card";
import { DocumentsCard } from "@/modules/people/ui/file/documents-card";
import { FileHeader } from "@/modules/people/ui/file/file-header";
import { FileTabs, type FileTab } from "@/modules/people/ui/file/file-tabs";
import {
  computeChecklist,
  formatDayMonth,
} from "@/modules/people/ui/file/helpers";
import { LeaveCard } from "@/modules/people/ui/file/leave-card";
import { NotesCard } from "@/modules/people/ui/file/notes-card";
import { PersonalCard } from "@/modules/people/ui/file/personal-card";
import { MyLeaveList } from "@/modules/people/ui/leave-lists";
import { ActionError } from "@/shared/ui/action-error";
import { hasWrite } from "@/shared/ui/requires-write";

/** Expediente de empleado (§14): la "Cuenta 360 de una persona".
 * Acceso: people_directory:write o el propio empleado (self, sin
 * notas y compensación solo lectura — regla del server). */
export default async function EmployeeFilePage({
  params,
}: PageProps<"/people/[id]">) {
  const { id } = await params;
  const today = new Date().toISOString().slice(0, 10);

  const [detailResult, compResult, leaveResult, canWrite, canWriteComp] =
    await Promise.all([
      getEmployeeDetail(id),
      getEmployeeCompensation(id),
      getLeaveBalanceFor(id),
      hasWrite("people_directory"),
      hasWrite("people_compensation"),
    ]);

  if (!detailResult.ok) {
    // Matriz §14 — rol de solo directorio en ficha ajena: cabecera
    // básica (nombre, cargo, área, correo, estado); nada sensible.
    const directory = await getTeamDirectory();
    const member = directory.ok
      ? directory.data.find((m) => m.id === id)
      : undefined;
    if (!member) return <ActionError message={detailResult.error} />;
    return (
      <div className="flex flex-col gap-5">
        <Link
          href="/people"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Equipo
        </Link>
        <div className="flex flex-wrap items-center gap-4 rounded-[14px] border bg-card px-6 py-5">
          <div className="grid size-14 shrink-0 place-items-center rounded-full bg-[#E6F9F1] font-[family-name:var(--font-display)] text-[19px] font-extrabold text-[#069B66]">
            {member.fullName
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-[family-name:var(--font-display)] text-xl font-extrabold text-[#011640]">
                {member.fullName}
              </h1>
              <MemberStatusBadge active={member.active} />
            </div>
            <p className="mt-1 truncate text-[12.5px] font-semibold text-muted-foreground">
              {[
                member.position,
                member.area,
                member.email,
                member.birthDayMonth
                  ? `Cumple ${formatDayMonth(member.birthDayMonth)}`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ") || "—"}
            </p>
          </div>
        </div>
        <p className="text-sm font-semibold text-muted-foreground">
          El expediente completo es visible para gestión — tu rol ve la ficha
          básica del directorio.
        </p>
      </div>
    );
  }
  const detail = detailResult.data;
  const compensation = compResult.ok ? compResult.data : null;
  const leave = leaveResult.ok ? leaveResult.data : null;
  const checklist = computeChecklist(detail.documents);
  const year = today.slice(0, 4);

  const grid = (main: React.ReactNode, side: React.ReactNode) => (
    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="flex min-w-0 flex-col gap-4">{main}</div>
      <div className="flex min-w-0 flex-col gap-4">{side}</div>
    </div>
  );

  const contractual = (
    <ContractualCard detail={detail} today={today} canWrite={canWrite} />
  );
  const personal = <PersonalCard detail={detail} canWrite={canWrite} />;
  const comp = compensation && (
    <CompensationCard
      compensation={compensation}
      canWriteCompensation={canWriteComp}
    />
  );
  const checklistCard = (
    <ChecklistCard detail={detail} canWrite={canWrite} today={today} />
  );
  const leaveCard = (
    <LeaveCard
      balance={leave?.balance ?? null}
      requests={leave?.requests ?? []}
      unit={LEAVE_DAY_UNIT}
      today={today}
      year={year}
    />
  );
  // El server manda notes: null en el caso self — la card ni se monta.
  const notes = canWrite && <NotesCard detail={detail} />;

  const tabs: FileTab[] = [
    {
      key: "resumen",
      label: "Resumen",
      panel: grid(
        <>
          {contractual}
          {personal}
          {comp}
        </>,
        <>
          {checklistCard}
          {leaveCard}
          {notes}
        </>,
      ),
    },
    { key: "contractual", label: "Contractual", panel: grid(contractual, checklistCard) },
    {
      key: "personal",
      label: "Personal y dotación",
      panel: grid(personal, checklistCard),
    },
    ...(compensation
      ? [{ key: "comp", label: "Compensación", panel: grid(comp, leaveCard) }]
      : []),
    {
      key: "docs",
      label: "Documentos",
      panel: grid(
        <DocumentsCard detail={detail} canWrite={canWrite} today={today} />,
        checklistCard,
      ),
    },
    {
      key: "ausencias",
      label: "Ausencias",
      panel: grid(
        leave && leave.requests.length > 0 ? (
          <div className="rounded-[14px] border bg-card p-4">
            <MyLeaveList requests={leave.requests} unit={LEAVE_DAY_UNIT} />
          </div>
        ) : (
          <p className="rounded-[14px] border bg-card p-5 text-sm font-semibold text-muted-foreground">
            Sin solicitudes de ausencia registradas.
          </p>
        ),
        leaveCard,
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/people"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Equipo
      </Link>
      <FileHeader
        detail={detail}
        today={today}
        canWrite={canWrite}
        checklist={checklist}
        remainingLeave={leave?.balance.remainingDays ?? null}
        leaveUnit={LEAVE_DAY_UNIT}
        salary={
          compensation && compensation.baseSalary !== null
            ? {
                amount: compensation.baseSalary,
                currency: compensation.baseSalaryCurrency,
              }
            : null
        }
      />
      <FileTabs tabs={tabs} />
    </div>
  );
}
