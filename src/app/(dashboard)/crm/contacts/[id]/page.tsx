import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAccount } from "@/modules/crm/application/accounts-actions";
import { listAccounts } from "@/modules/crm/application/accounts-actions";
import { getContact } from "@/modules/crm/application/contacts-actions";
import { ContactForm } from "@/modules/crm/ui/contact-form";
import { ActionError } from "@/shared/ui/action-error";
import { formatDate } from "@/shared/ui/format";

function Item({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{value ?? "—"}</dd>
    </div>
  );
}

export default async function ContactDetailPage({
  params,
}: PageProps<"/crm/contacts/[id]">) {
  const { id } = await params;
  const [contactResult, accountsResult] = await Promise.all([
    getContact(id),
    listAccounts(),
  ]);
  if (!contactResult.ok) {
    if (contactResult.error === "No encontrado") notFound();
    return <ActionError message={contactResult.error} />;
  }
  if (!accountsResult.ok) return <ActionError message={accountsResult.error} />;

  const contact = contactResult.data;
  const account = contact.accountId
    ? await getAccount(contact.accountId)
    : null;
  const accountOptions = accountsResult.data.map(({ id, name }) => ({
    id,
    name,
  }));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link
        href="/crm/contacts"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Contactos
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{contact.name}</h1>
          {contact.jobTitle && (
            <p className="text-sm text-muted-foreground">{contact.jobTitle}</p>
          )}
        </div>
        <ContactForm
          contact={contact}
          accounts={accountOptions}
          triggerLabel="Editar"
        />
      </div>

      <dl className="grid grid-cols-2 gap-4 rounded-lg border bg-card p-5 sm:grid-cols-3">
        <Item label="Email" value={contact.email} />
        <Item label="Teléfono" value={contact.phone} />
        <Item
          label="Cuenta"
          value={
            account?.ok ? (
              <Link
                href={`/crm/accounts/${account.data.id}`}
                className="hover:underline"
              >
                {account.data.name}
              </Link>
            ) : null
          }
        />
        <Item label="Creado" value={formatDate(contact.createdAt)} />
      </dl>

      {contact.notes && (
        <div className="rounded-lg border bg-card p-5">
          <p className="text-xs text-muted-foreground">Notas</p>
          <p className="mt-1 text-sm whitespace-pre-wrap">{contact.notes}</p>
        </div>
      )}
    </div>
  );
}
