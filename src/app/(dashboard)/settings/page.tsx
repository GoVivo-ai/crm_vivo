import { getCurrentUser } from "@/modules/identity/application/get-current-user";
import { listUsers } from "@/modules/identity/application/users-admin-actions";
import { UsersTable } from "@/modules/identity/ui/users-table";
import { ActionError } from "@/shared/ui/action-error";

export default async function SettingsPage() {
  const [result, currentUser] = await Promise.all([
    listUsers(),
    getCurrentUser(),
  ]);
  if (!result.ok) return <ActionError message={result.error} />;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Usuarios y roles</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Activa las cuentas nuevas y asigna el rol que define qué módulos ve
          cada persona.
        </p>
      </div>
      <UsersTable users={result.data} currentUserId={currentUser?.id ?? ""} />
    </div>
  );
}
