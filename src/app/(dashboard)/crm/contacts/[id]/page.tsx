import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import {
  getAccount,
  listAccounts,
} from "@/modules/crm/application/accounts-actions";
import { listActivitiesForContact } from "@/modules/crm/application/activities-actions";
import { getContact } from "@/modules/crm/application/contacts-actions";
import { getPipelineBoard } from "@/modules/crm/application/deals-actions";
import { listUserNames } from "@/modules/identity/application/list-user-names";
import { ActivityForm } from "@/modules/crm/ui/activity-form";
import { ActivityTimeline } from "@/modules/crm/ui/activity-timeline";
import { ContactForm } from "@/modules/crm/ui/contact-form";
import { ActionError } from "@/shared/ui/action-error";
import { EntityHeader } from "@/shared/ui/entity/entity-header";
import { EntityRow } from "@/shared/ui/entity/entity-row";
import { initialsOf, tintFor } from "@/shared/ui/entity/tints";
import { formatCurrency } from "@/shared/ui/format";
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

/** Ficha de contacto (§15.1). */
export default async function ContactDetailPage({
  params,
}: PageProps<"/crm/contacts/[id]">) {
  const { id } = await params;
  const today = new Date().toISOString().slice(0, 10);
  const [contactResult, accountsResult, boardResult, activitiesResult, namesResult] =
    await Promise.all([
      getContact(id),
      listAccounts(),
      getPipelineBoard(),
      listActivitiesForContact(id),
      listUserNames(),
    ]);
  if (!contactResult.ok) {
    if (contactResult.error === "No encontrado") notFound();
    return <ActionError message={contactResult.error} />;
  }
  const contact = contactResult.data;
  const accountResult = contact.accountId
    ? await getAccount(contact.accountId)
    : null;
  const account = accountResult?.ok ? accountResult.data : null;
  const accountOptions = (accountsResult.ok ? accountsResult.data : []).map(
    ({ id: aid, name }) => ({ id: aid, name }),
  );

  // Negocios donde este contacto es el interlocutor (desde el board).
  const stages = boardResult.ok ? boardResult.data.stages : [];
  const contactDeals = stages.flatMap((s) =>
    s.deals
      .filter((d) => d.contactId === contact.id)
      .map((d) => ({ ...d, stageName: s.name, closed: s.isWon || s.isLost })),
  );
  const openCount = contactDeals.filter((d) => !d.closed).length;

  const activities = activitiesResult.ok ? activitiesResult.data : [];
  const authors = Object.fromEntries(
    (namesResult.ok ? namesResult.data : []).map((u) => [u.id, u.name]),
  );

  const createdDays = Math.max(
    0,
    -daysUntil(contact.createdAt.toISOString().slice(0, 10), today),
  );
  const meta = [
    contact.jobTitle,
    account?.name,
    contact.email,
    `creado hace ${createdDays} día${createdDays === 1 ? "" : "s"}`,
  ]
    .filter(Boolean)
    .join(" · ");
  const tint = tintFor(contact.id);
  const accountTint = account ? tintFor(account.id) : null;

  return (
    <div className="flex flex-col gap-5">
      <CrumbTitle title={contact.name} />
      <Link
        href="/crm/contacts"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Contactos
      </Link>

      <EntityHeader
        tile={{ content: initialsOf(contact.name), bg: tint.bg, fg: tint.fg }}
        name={contact.name}
        meta={meta}
        stats={[{ label: "Negocios abiertos", value: String(openCount) }]}
        actions={
          <RequiresWrite resource="crm">
            <ContactForm
              contact={contact}
              accounts={accountOptions}
              triggerLabel="Editar"
            />
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
                  <ActivityForm contactId={contact.id} />
                </RequiresWrite>
              </span>
            }
          >
            <div className="px-5 pt-3.5 pb-5">
              <ActivityTimeline activities={activities} authors={authors} />
            </div>
          </Card>
          <Card
            title="Negocios"
            right={
              <span className="ml-auto rounded-full bg-[#EEF1F6] px-2.5 py-1 text-[11px] font-extrabold text-[#5A6B85]">
                {contactDeals.length}
              </span>
            }
          >
            <div className="px-5 pt-1 pb-3.5">
              {contactDeals.length === 0 ? (
                <p className="py-2 text-xs font-semibold text-muted-foreground">
                  Este contacto no es interlocutor de ningún negocio todavía.
                </p>
              ) : (
                contactDeals.map((d) => (
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
          {contact.notes && (
            <Card title="Notas">
              <p className="px-5 pt-2.5 pb-4 text-[12.5px] leading-relaxed font-semibold whitespace-pre-wrap text-muted-foreground">
                {contact.notes}
              </p>
            </Card>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Card title="Datos de contacto">
            <div className="px-5 pt-1 pb-3">
              <Kv k="Correo" v={contact.email ?? "—"} />
              <Kv k="Teléfono" v={<span className="tabular-nums">{contact.phone ?? "—"}</span>} />
              <Kv k="Cargo" v={contact.jobTitle ?? "—"} />
            </div>
          </Card>
          {account && accountTint && (
            <Card
              title="La cuenta"
              right={
                <Link
                  href={
                    (account.status === "prospect"
                      ? `/crm/accounts/${account.id}`
                      : `/clients/${account.id}`) as Route
                  }
                  className="ml-auto text-xs font-bold text-[#069B66] hover:text-[#045C3D]"
                >
                  Abrir cuenta →
                </Link>
              }
            >
              <div className="px-5 pt-3 pb-4">
                <div className="flex items-center gap-3">
                  <span
                    className="grid size-[30px] shrink-0 place-items-center rounded-[9px] font-[family-name:var(--font-display)] text-[11px] font-extrabold"
                    style={{ background: accountTint.bg, color: accountTint.fg }}
                  >
                    {initialsOf(account.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-extrabold">
                      {account.name}
                    </p>
                    <p className="truncate text-[11.5px] font-semibold text-muted-foreground">
                      {[account.industry, account.nit ?? "sin NIT"]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
