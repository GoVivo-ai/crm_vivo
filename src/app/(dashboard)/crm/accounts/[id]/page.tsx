import { ArrowLeft, Briefcase } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { notFound, redirect } from "next/navigation";
import { getAccount } from "@/modules/crm/application/accounts-actions";
import { listActivitiesForAccount } from "@/modules/crm/application/activities-actions";
import { listContacts } from "@/modules/crm/application/contacts-actions";
import { getPipelineBoard } from "@/modules/crm/application/deals-actions";
import { listUserNames } from "@/modules/identity/application/list-user-names";
import { ActivityForm } from "@/modules/crm/ui/activity-form";
import { ActivityTimeline } from "@/modules/crm/ui/activity-timeline";
import { AccountForm } from "@/modules/crm/ui/account-form";
import { AccountStatusBadge } from "@/modules/crm/ui/labels";
import { ActionError } from "@/shared/ui/action-error";
import { EntityHeader } from "@/shared/ui/entity/entity-header";
import { EntityRow } from "@/shared/ui/entity/entity-row";
import { tintFor } from "@/shared/ui/entity/tints";
import { formatCompactMoney, formatCurrency } from "@/shared/ui/format";
import { CrumbTitle } from "@/shared/ui/page-title";
import { RequiresWrite } from "@/shared/ui/requires-write";
import { daysUntil } from "@/modules/people/ui/file/helpers";

function Card({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[14px] border bg-card shadow-[0_1px_2px_rgba(1,22,64,0.04)]">
      <div className="flex items-center gap-2.5 px-5 pt-4">
        <h2 className="font-[family-name:var(--font-display)] text-[15px] font-extrabold text-[#011640]">
          {title}
        </h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function Kv({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3.5 border-b border-[#EDF0F5] py-2.5 last:border-b-0">
      <span className="text-[12.5px] font-semibold text-muted-foreground">{k}</span>
      <span className="min-w-0 truncate text-right text-[13px] font-bold">{v}</span>
    </div>
  );
}

/** Ficha de cuenta CRM (§15.1) — SOLO prospectos: cuando la cuenta ya
 * es cliente, el canon es el Cliente 360 y esta ruta redirige. */
export default async function AccountDetailPage({
  params,
}: PageProps<"/crm/accounts/[id]">) {
  const { id } = await params;
  const today = new Date().toISOString().slice(0, 10);
  const result = await getAccount(id);
  if (!result.ok) {
    if (result.error === "No encontrado") notFound();
    return <ActionError message={result.error} />;
  }
  const account = result.data;
  if (account.status !== "prospect") redirect(`/clients/${account.id}`);

  const [contactsResult, boardResult, activitiesResult, namesResult] =
    await Promise.all([
      listContacts(),
      getPipelineBoard(),
      listActivitiesForAccount(id),
      listUserNames(),
    ]);
  const contacts = (contactsResult.ok ? contactsResult.data : []).filter(
    (c) => c.accountId === account.id,
  );
  const stages = boardResult.ok ? boardResult.data.stages : [];
  const accountDeals = stages.flatMap((s) =>
    s.deals
      .filter((d) => d.accountId === account.id)
      .map((d) => ({ ...d, stageName: s.name, closed: s.isWon || s.isLost })),
  );
  const openDeals = accountDeals.filter((d) => !d.closed);
  const openSum = openDeals.reduce((s, d) => s + (d.amount ?? 0), 0);
  const activities = activitiesResult.ok ? activitiesResult.data : [];
  const authors = Object.fromEntries(
    (namesResult.ok ? namesResult.data : []).map((u) => [u.id, u.name]),
  );
  // "vía negocio X" cuando la actividad llega desde un deal de la cuenta.
  const dealTitles = new Map(accountDeals.map((d) => [d.id, d.title]));
  const timelineActivities = activities.map((a) =>
    a.dealId && dealTitles.has(a.dealId)
      ? { ...a, subject: `${a.subject} · vía ${dealTitles.get(a.dealId)}` }
      : a,
  );

  const createdDays = Math.max(
    0,
    -daysUntil(account.createdAt.toISOString().slice(0, 10), today),
  );
  const meta = [
    account.nit ? `NIT ${account.nit}` : null,
    account.industry,
    `creada hace ${createdDays} día${createdDays === 1 ? "" : "s"}`,
  ]
    .filter(Boolean)
    .join(" · ");
  const tint = tintFor(account.id);

  return (
    <div className="flex flex-col gap-5">
      <CrumbTitle title={account.name} />
      <Link
        href="/crm/accounts"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Cuentas
      </Link>

      <EntityHeader
        tile={{
          content: <Briefcase className="size-[22px]" strokeWidth={1.9} />,
          bg: tint.bg,
          fg: tint.fg,
        }}
        name={account.name}
        badges={<AccountStatusBadge status={account.status} />}
        meta={meta}
        stats={[
          {
            label: "Negocios abiertos",
            value:
              openDeals.length > 0
                ? `${openDeals.length} · ${formatCompactMoney(openSum)}`
                : "0",
          },
          { label: "Contactos", value: String(contacts.length) },
        ]}
        actions={
          <RequiresWrite resource="crm">
            <AccountForm account={account} triggerLabel="Editar" />
          </RequiresWrite>
        }
      />

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <Card
            title="Actividades"
            right={
              <span className="ml-auto">
                <RequiresWrite resource="crm">
                  <ActivityForm accountId={account.id} />
                </RequiresWrite>
              </span>
            }
          >
            <div className="px-5 pt-3.5 pb-5">
              <ActivityTimeline
                activities={timelineActivities}
                authors={authors}
              />
            </div>
          </Card>
          <Card
            title="Negocios"
            right={
              <span className="ml-auto rounded-full bg-[#EEF1F6] px-2.5 py-1 text-[11px] font-extrabold text-[#5A6B85]">
                {accountDeals.length}
              </span>
            }
          >
            <div className="px-5 pt-1 pb-3.5">
              {accountDeals.length === 0 ? (
                <p className="py-2 text-xs font-semibold text-muted-foreground">
                  Sin negocios todavía — créalo desde el pipeline.
                </p>
              ) : (
                accountDeals.map((d) => (
                  <EntityRow
                    key={d.id}
                    id={d.id}
                    name={d.title}
                    meta={d.stageName}
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
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Card title="Detalles">
            <div className="px-5 pt-1 pb-3">
              <Kv k="NIT" v={account.nit ?? "—"} />
              <Kv k="Industria" v={account.industry ?? "—"} />
              <Kv k="Sitio web" v={account.website ?? "—"} />
              <Kv
                k="Facturación (QuickBooks)"
                v={
                  account.billingCustomerId ? (
                    "Vinculada"
                  ) : (
                    <span className="text-[#8C7A0A]">Sin vincular</span>
                  )
                }
              />
            </div>
          </Card>
          <Card
            title="Contactos"
            right={
              <span className="ml-auto rounded-full bg-[#EEF1F6] px-2.5 py-1 text-[11px] font-extrabold text-[#5A6B85]">
                {contacts.length}
              </span>
            }
          >
            <div className="px-5 pt-1 pb-3.5">
              {contacts.length === 0 ? (
                <p className="py-2 text-xs font-semibold text-muted-foreground">
                  Esta cuenta aún no tiene contactos asociados.
                </p>
              ) : (
                contacts.map((c) => (
                  <EntityRow
                    key={c.id}
                    id={c.id}
                    name={c.name}
                    meta={
                      [c.jobTitle, c.email].filter(Boolean).join(" · ") || null
                    }
                    href={`/crm/contacts/${c.id}` as Route}
                  />
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
