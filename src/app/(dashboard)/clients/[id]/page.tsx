import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { getAccount360 } from "@/modules/clients/application/get-account-360";
import { getClientsHealthList } from "@/modules/clients/application/clients-health-action";
import { listServices } from "@/modules/clients/application/services-actions";
import { InvoicesCard } from "@/modules/clients/ui/three-sixty/invoices-card";
import { ProjectsCard } from "@/modules/clients/ui/three-sixty/projects-card";
import { StaffingCard } from "@/modules/clients/ui/three-sixty/staffing-card";
import { ServicesSection } from "@/modules/clients/ui/services-section";
import { listInvoices } from "@/modules/finance/application/invoices-actions";
import { listAccountStaffing } from "@/modules/profitability/application/staffing-actions";
import { AccountForm } from "@/modules/crm/ui/account-form";
import { AccountStatusBadge } from "@/modules/crm/ui/labels";
import { ActionError } from "@/shared/ui/action-error";
import { DetailTabs, type DetailTab } from "@/shared/ui/entity/detail-tabs";
import { EntityHeader } from "@/shared/ui/entity/entity-header";
import { EntityRow } from "@/shared/ui/entity/entity-row";
import { initialsOf } from "@/shared/ui/entity/tints";
import { formatCompactMoney, formatCurrency } from "@/shared/ui/format";
import { CrumbTitle } from "@/shared/ui/page-title";
import { RequiresWrite } from "@/shared/ui/requires-write";

const HEALTH_BADGE = {
  green: { label: "Cuenta sana", cls: "bg-[#E6F9F1] text-[#069B66]" },
  yellow: { label: "Atención", cls: "bg-[#FBF7D9] text-[#8C7A0A]" },
  red: { label: "En riesgo", cls: "bg-[#FAEAEA] text-[#C93A3A]" },
} as const;

const MONTHS = "ene feb mar abr may jun jul ago sep oct nov dic".split(" ");

function byCurrency(record: Record<string, number>): string {
  const entries = Object.entries(record).filter(([, v]) => v > 0);
  if (entries.length === 0) return "—";
  return entries
    .map(([code, amount]) =>
      code === "COP"
        ? formatCompactMoney(amount)
        : `${formatCompactMoney(amount)} ${code}`,
    )
    .join(" · ");
}

/** Cliente 360 (§15 tanda 2): Cuenta360.dc.html, aprobado del origen. */
export default async function Client360Page({
  params,
}: PageProps<"/clients/[id]">) {
  const { id } = await params;
  const [result, catalogResult, invoicesResult, staffingResult, healthResult] =
    await Promise.all([
      getAccount360(id),
      listServices(),
      listInvoices({ accountId: id }),
      listAccountStaffing(id),
      getClientsHealthList(),
    ]);
  if (!result.ok) {
    if (result.error.includes("no encontrada")) notFound();
    return <ActionError message={result.error} />;
  }
  const { account, contacts, deals, services, projects, mrrByCurrency } =
    result.data;
  const catalog = catalogResult.ok
    ? catalogResult.data.filter((s) => s.isActive)
    : [];
  const invoices = invoicesResult.ok ? invoicesResult.data : [];
  const staffing = staffingResult.ok ? staffingResult.data : null;
  const health = healthResult.ok
    ? (healthResult.data.find((c) => c.accountId === id) ?? null)
    : null;
  const today = new Date().toISOString().slice(0, 10);

  // Cartera pendiente: saldo de las facturas abiertas, por moneda.
  const outstanding: Record<string, number> = {};
  for (const inv of invoices) {
    if (inv.status !== "open") continue;
    outstanding[inv.currencyCode] =
      (outstanding[inv.currencyCode] ?? 0) + (inv.total - inv.totalPaid);
  }

  const created = account.createdAt;
  const meta = [
    account.nit ? `NIT ${account.nit}` : null,
    account.industry,
    `Cliente desde ${MONTHS[created.getMonth()]} ${created.getFullYear()}`,
    account.billingCustomerId ? "Vinculada a QuickBooks" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const servicesCard = (
    <ServicesSection
      accountId={account.id}
      services={services}
      catalog={catalog}
      today={today}
    />
  );
  const projectsCard = (
    <ProjectsCard accountId={account.id} projects={projects} />
  );
  const contactsCard = (
    <section className="rounded-[14px] border bg-card shadow-[0_1px_2px_rgba(1,22,64,0.04)]">
      <div className="flex items-center gap-2.5 px-5 pt-4">
        <h2 className="font-[family-name:var(--font-display)] text-[15px] font-extrabold text-[#011640]">
          Contactos
        </h2>
        <span className="ml-auto rounded-full bg-[#EEF1F6] px-2.5 py-1 text-[11px] font-extrabold text-[#5A6B85]">
          {contacts.length}
        </span>
      </div>
      <div className="px-5 pt-1 pb-3.5">
        {contacts.length === 0 ? (
          <p className="py-2 text-xs font-semibold text-muted-foreground">
            Sin contactos registrados.
          </p>
        ) : (
          contacts
            .slice(0, 5)
            .map((c) => (
              <EntityRow
                key={c.id}
                id={c.id}
                name={c.name}
                meta={[c.jobTitle, c.email].filter(Boolean).join(" · ") || null}
                href={`/crm/contacts/${c.id}` as Route}
              />
            ))
        )}
      </div>
    </section>
  );
  const dealsCard = (
    <section className="rounded-[14px] border bg-card shadow-[0_1px_2px_rgba(1,22,64,0.04)]">
      <div className="flex items-center gap-2.5 px-5 pt-4">
        <h2 className="font-[family-name:var(--font-display)] text-[15px] font-extrabold text-[#011640]">
          Negocios
        </h2>
        <span className="ml-auto rounded-full bg-[#EEF1F6] px-2.5 py-1 text-[11px] font-extrabold text-[#5A6B85]">
          {deals.length}
        </span>
      </div>
      <div className="px-5 pt-1 pb-3.5">
        {deals.length === 0 ? (
          <p className="py-2 text-xs font-semibold text-muted-foreground">
            Sin negocios registrados.
          </p>
        ) : (
          deals
            .slice(0, 5)
            .map((d) => (
              <EntityRow
                key={d.id}
                id={d.id}
                name={d.title}
                right={
                  <span className="text-xs font-extrabold tabular-nums">
                    {d.amount !== null
                      ? formatCurrency(d.amount, d.currency)
                      : "—"}
                  </span>
                }
                href={`/crm/deals/${d.id}` as Route}
              />
            ))
        )}
      </div>
    </section>
  );

  const grid = (main: React.ReactNode, side: React.ReactNode) => (
    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-4">{main}</div>
      <div className="flex min-w-0 flex-col gap-4">{side}</div>
    </div>
  );

  const tabs: DetailTab[] = [
    {
      key: "resumen",
      label: "Resumen",
      panel: grid(
        <>
          {servicesCard}
          {projectsCard}
          <InvoicesCard invoices={invoices} limit={5} />
        </>,
        <>
          {staffing !== null && <StaffingCard assignments={staffing} />}
          {contactsCard}
          {dealsCard}
        </>,
      ),
    },
    { key: "servicios", label: "Servicios", panel: grid(servicesCard, contactsCard) },
    { key: "proyectos", label: "Proyectos", panel: grid(projectsCard, contactsCard) },
    {
      key: "facturacion",
      label: "Facturación",
      panel: grid(<InvoicesCard invoices={invoices} />, dealsCard),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <CrumbTitle title={account.name} />
      <Link
        href="/clients"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Clientes
      </Link>

      <EntityHeader
        tile={{
          content: initialsOf(account.name),
          bg: "#011640",
          fg: "#FFFFFF",
        }}
        name={account.name}
        badges={
          <>
            {health && (
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${HEALTH_BADGE[health.bucket].cls}`}
              >
                {HEALTH_BADGE[health.bucket].label}
              </span>
            )}
            <AccountStatusBadge status={account.status} />
          </>
        }
        meta={meta}
        stats={[
          { label: "MRR", value: byCurrency(mrrByCurrency) },
          { label: "Cartera pendiente", value: byCurrency(outstanding) },
          ...(health?.marginCop !== undefined
            ? [{ label: "Margen 3 m", value: formatCompactMoney(health.marginCop) }]
            : []),
        ]}
        actions={
          <RequiresWrite resource="crm">
            <AccountForm account={account} triggerLabel="Editar" />
          </RequiresWrite>
        }
      />

      <DetailTabs tabs={tabs} />
    </div>
  );
}
