import { Search } from "lucide-react";
import type { Route } from "next";
import { Input } from "@/components/ui/input";
import {
  IdentityCell,
  LIST_TH,
  ListFooter,
  RowChevron,
} from "@/shared/ui/entity/list-bits";
import { listAccounts } from "@/modules/crm/application/accounts-actions";
import { listContacts } from "@/modules/crm/application/contacts-actions";
import { ContactForm } from "@/modules/crm/ui/contact-form";
import { ActionError } from "@/shared/ui/action-error";
import { EmptyState } from "@/shared/ui/empty-state";

export default async function ContactsPage({
  searchParams,
}: PageProps<"/crm/contacts">) {
  const { q } = await searchParams;
  const search = typeof q === "string" && q !== "" ? q : null;

  const [contactsResult, accountsResult] = await Promise.all([
    listContacts({ search }),
    listAccounts(),
  ]);
  if (!contactsResult.ok) return <ActionError message={contactsResult.error} />;
  if (!accountsResult.ok) return <ActionError message={accountsResult.error} />;

  const contacts = contactsResult.data;
  const accountName = new Map(accountsResult.data.map((a) => [a.id, a.name]));
  const accountOptions = accountsResult.data.map(({ id, name }) => ({
    id,
    name,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="flex items-center gap-2">
          <form className="relative" action="/crm/contacts">
            <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Buscar contacto…"
              defaultValue={search ?? ""}
              className="w-56 pl-8"
            />
          </form>
          <ContactForm accounts={accountOptions} triggerLabel="Nuevo contacto" />
        </div>
      </div>

      {contacts.length === 0 ? (
        <EmptyState
          title={search ? `Sin resultados para "${search}"` : "Aún no hay contactos"}
          hint={
            search
              ? "Prueba con otro nombre o revisa la ortografía."
              : "Registra a las personas con las que negocias: cada negocio y actividad se cuelga de un contacto."
          }
          action={
            search ? undefined : (
              <ContactForm
                accounts={accountOptions}
                triggerLabel="Crear el primer contacto"
              />
            )
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-[14px] border bg-card shadow-[0_1px_2px_rgba(1,22,64,0.04)]">
          <table className="w-full text-[13px] font-semibold">
            <thead>
              <tr className="border-b">
                <th className={LIST_TH}>Contacto</th>
                <th className={LIST_TH}>Cargo</th>
                <th className={LIST_TH}>Cuenta</th>
                <th className={LIST_TH}>Teléfono</th>
                <th className={LIST_TH} aria-hidden />
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr
                  key={contact.id}
                  className="relative border-b border-[#EDF0F5] transition-colors last:border-b-0 hover:bg-[#F6F7F9]"
                >
                  <td className="px-5 py-3">
                    <IdentityCell
                      id={contact.id}
                      name={contact.name}
                      sub={contact.email ?? "Sin correo"}
                      href={`/crm/contacts/${contact.id}` as Route}
                    />
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {contact.jobTitle ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    {contact.accountId
                      ? (accountName.get(contact.accountId) ?? "—")
                      : "—"}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-muted-foreground tabular-nums">
                    {contact.phone ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <RowChevron />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ListFooter shown={contacts.length} total={contacts.length} />
        </div>
      )}
    </div>
  );
}
