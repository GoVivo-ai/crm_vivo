import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAccount360 } from "@/modules/clients/application/get-account-360";
import { listServices } from "@/modules/clients/application/services-actions";
import { HealthBadge } from "@/modules/clients/ui/health-badge";
import { ProjectForm } from "@/modules/clients/ui/project-form";
import { ServicesSection } from "@/modules/clients/ui/services-section";
import { AccountStatusBadge } from "@/modules/crm/ui/labels";
import { ActionError } from "@/shared/ui/action-error";
import { CrumbTitle } from "@/shared/ui/page-title";
import { formatMoney } from "@/shared/ui/format";
import { KpiMultiCurrency } from "@/shared/ui/kpi";

export default async function Client360Page({
  params,
}: PageProps<"/clients/[id]">) {
  const { id } = await params;
  const [result, catalogResult] = await Promise.all([
    getAccount360(id),
    listServices(),
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
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Link
        href="/clients"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Clientes
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <CrumbTitle title={account.name} />
          <h1 className="text-2xl font-semibold">{account.name}</h1>
          <AccountStatusBadge status={account.status} />
        </div>
        <KpiMultiCurrency
          label="MRR"
          amounts={mrrByCurrency}
          className="min-w-44 border-module-clients/30"
        />
      </div>

      <ServicesSection
        accountId={account.id}
        services={services}
        catalog={catalog}
        today={today}
      />

      <section className="rounded-lg border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Proyectos</h2>
          <ProjectForm accountId={account.id} />
        </div>
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin proyectos todavía.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {projects.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-3 rounded-md border px-3 py-2"
              >
                <span className="text-sm font-medium">{p.name}</span>
                <HealthBadge health={p.health} />
                {p.clickupListId === null && (
                  <span className="text-xs text-muted-foreground">
                    Sin sync de ClickUp
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-lg border bg-card p-5">
          <h2 className="mb-2 text-sm font-semibold">Contactos</h2>
          {contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin contactos.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {contacts.map((c) => (
                <li key={c.id} className="text-sm">
                  <Link
                    href={`/crm/contacts/${c.id}`}
                    className="hover:underline"
                  >
                    {c.name}
                  </Link>
                  {c.jobTitle && (
                    <span className="text-muted-foreground">
                      {" "}
                      · {c.jobTitle}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border bg-card p-5">
          <h2 className="mb-2 text-sm font-semibold">Deals</h2>
          {deals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin deals.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {deals.map((d) => (
                <li key={d.id} className="flex items-baseline gap-2 text-sm">
                  <Link href={`/crm/deals/${d.id}`} className="hover:underline">
                    {d.title}
                  </Link>
                  <span className="ml-auto font-mono text-xs">
                    {d.amount !== null ? formatMoney(d.amount) : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
