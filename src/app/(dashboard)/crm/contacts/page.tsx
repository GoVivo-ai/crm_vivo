import { Search } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
              : "Registra a las personas con las que negocias: cada deal y actividad se cuelga de un contacto."
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
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Cuenta</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/crm/contacts/${contact.id}`}
                      className="hover:underline"
                    >
                      {contact.name}
                    </Link>
                  </TableCell>
                  <TableCell>{contact.jobTitle ?? "—"}</TableCell>
                  <TableCell>
                    {contact.accountId
                      ? (accountName.get(contact.accountId) ?? "—")
                      : "—"}
                  </TableCell>
                  <TableCell>{contact.email ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {contact.phone ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
