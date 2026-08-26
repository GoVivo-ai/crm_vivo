import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAccount } from "@/modules/crm/application/accounts-actions";
import { listContacts } from "@/modules/crm/application/contacts-actions";
import { AccountForm } from "@/modules/crm/ui/account-form";
import { AccountStatusBadge } from "@/modules/crm/ui/labels";
import { ActionError } from "@/shared/ui/action-error";
import { CrumbTitle } from "@/shared/ui/page-title";
import { formatDate } from "@/shared/ui/format";

function Item({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{value ?? "—"}</dd>
    </div>
  );
}

export default async function AccountDetailPage({
  params,
}: PageProps<"/crm/accounts/[id]">) {
  const { id } = await params;
  const result = await getAccount(id);
  if (!result.ok) {
    if (result.error === "No encontrado") notFound();
    return <ActionError message={result.error} />;
  }
  const account = result.data;
  const contactsResult = await listContacts();
  const contacts = contactsResult.ok
    ? contactsResult.data.filter((c) => c.accountId === account.id)
    : [];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link
        href="/crm/accounts"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Cuentas
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <CrumbTitle title={account.name} />
          <h1 className="text-2xl font-semibold">{account.name}</h1>
          <AccountStatusBadge status={account.status} />
        </div>
        <AccountForm account={account} triggerLabel="Editar" />
      </div>

      <dl className="grid grid-cols-2 gap-4 rounded-lg border bg-card p-5 sm:grid-cols-3">
        <Item label="NIT" value={account.nit} />
        <Item label="Industria" value={account.industry} />
        <Item label="Sitio web" value={account.website} />
        <Item label="Creada" value={formatDate(account.createdAt)} />
        <Item
          label="Facturación (QuickBooks)"
          value={
            account.billingCustomerId ? (
              <span className="font-mono text-xs">
                {account.billingCustomerId}
              </span>
            ) : (
              <span className="text-health-warn">Sin vincular</span>
            )
          }
        />
      </dl>

      <div className="rounded-lg border bg-card p-5">
        <p className="text-sm font-medium">Contactos</p>
        {contacts.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Esta cuenta aún no tiene contactos asociados.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1.5">
            {contacts.map((c) => (
              <li key={c.id} className="text-sm">
                <Link href={`/crm/contacts/${c.id}`} className="hover:underline">
                  {c.name}
                </Link>
                {c.jobTitle && (
                  <span className="text-muted-foreground"> · {c.jobTitle}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {account.notes && (
        <div className="rounded-lg border bg-card p-5">
          <p className="text-xs text-muted-foreground">Notas</p>
          <p className="mt-1 text-sm whitespace-pre-wrap">{account.notes}</p>
        </div>
      )}
    </div>
  );
}
