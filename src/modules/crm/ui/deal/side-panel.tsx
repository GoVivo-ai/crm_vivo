import Link from "next/link";
import type { Route } from "next";
import type { Account, Contact, Deal } from "@/modules/crm/domain/types";
import { EntityRow } from "@/shared/ui/entity/entity-row";
import { initialsOf, tintFor } from "@/shared/ui/entity/tints";
import { formatCompactMoney } from "@/shared/ui/format";
import { DealDetailsForm } from "./deal-details-form";

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
      <span className="text-right text-[13px] font-bold">{v}</span>
    </div>
  );
}

/** Panel lateral del detalle de negocio (§15.1): Detalles editables +
 * card de la cuenta madre con mini-stats + contactos relacionados. */
export function DealSidePanel({
  deal,
  account,
  contact,
  contacts,
  canWrite,
  openStats,
}: {
  deal: Deal;
  account: Account | null;
  contact: Contact | null;
  contacts: Contact[];
  canWrite: boolean;
  openStats: { count: number; sumCop: number; won: number };
}) {
  const accountTint = account ? tintFor(account.id) : null;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <Card
        title="Detalles"
        right={
          canWrite && (
            <DealDetailsForm
              deal={deal}
              contacts={contacts.map(({ id, name }) => ({ id, name }))}
            />
          )
        }
      >
        <div className="px-5 pt-1 pb-3">
          <Kv
            k="Cuenta"
            v={
              account ? (
                <Link
                  href={`/crm/accounts/${account.id}` as Route}
                  className="font-extrabold text-[#069B66] hover:text-[#045C3D]"
                >
                  {account.name} →
                </Link>
              ) : (
                "—"
              )
            }
          />
          <Kv k="Contacto" v={contact?.name ?? "—"} />
          <Kv k="Moneda" v={deal.currency} />
        </div>
      </Card>

      {account && accountTint && (
        <Card
          title="La cuenta"
          right={
            <Link
              href={`/crm/accounts/${account.id}` as Route}
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
                <p className="truncate text-[13px] font-extrabold">{account.name}</p>
                <p className="truncate text-[11.5px] font-semibold text-muted-foreground">
                  {[account.industry, account.status, account.nit ?? "sin NIT"]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-6 border-t border-[#EDF0F5] pt-3">
              <div>
                <span className="text-[9.5px] font-bold tracking-[0.1em] uppercase text-[#8B99B0]">
                  Negocios abiertos
                </span>
                <p className="font-[family-name:var(--font-display)] text-[15px] font-extrabold text-[#011640] tabular-nums">
                  {openStats.count} · {formatCompactMoney(openStats.sumCop)}
                </p>
              </div>
              <div>
                <span className="text-[9.5px] font-bold tracking-[0.1em] uppercase text-[#8B99B0]">
                  Ganados
                </span>
                <p className="font-[family-name:var(--font-display)] text-[15px] font-extrabold text-[#011640] tabular-nums">
                  {openStats.won}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

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
              La cuenta no tiene contactos registrados.
            </p>
          ) : (
            contacts.slice(0, 5).map((c) => (
              <EntityRow
                key={c.id}
                id={c.id}
                name={c.name}
                meta={[c.jobTitle, c.email].filter(Boolean).join(" · ") || null}
                href={`/crm/contacts/${c.id}` as Route}
              />
            ))
          )}
          {contacts.length > 5 && (
            <Link
              href="/crm/contacts"
              className="mt-1 inline-block text-xs font-extrabold text-[#069B66] hover:text-[#045C3D]"
            >
              Ver todos ({contacts.length}) →
            </Link>
          )}
        </div>
      </Card>
    </div>
  );
}
