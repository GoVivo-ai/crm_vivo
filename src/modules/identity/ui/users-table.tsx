"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ManagedUser } from "@/modules/identity/application/users-admin-actions";
import {
  setUserActive,
  setUserRole,
} from "@/modules/identity/application/users-admin-actions";
import { ROLES, type Role } from "@/modules/identity/domain/permissions";
import { ChipSelect } from "@/shared/ui/chip-select";
import { useActionSubmit } from "@/shared/ui/use-action-submit";

const ROLE_LABELS: Record<Role, string> = {
  admin: "Administración",
  sales: "Ventas",
  operations: "Operaciones",
  finance: "Finanzas",
  management: "Gerencia",
};

type UsersTableProps = {
  users: ManagedUser[];
  /** Fila propia deshabilitada: backend prohíbe auto-modificarse. */
  currentUserId: string;
};

export function UsersTable({ users, currentUserId }: UsersTableProps) {
  const { submit, pending } = useActionSubmit<ManagedUser>();

  // Cambio de rol ajeno: éxito con "Deshacer" (patrón del diseñador).
  // La fila propia sigue deshabilitada (nadie se auto-modifica).
  function changeRole(user: ManagedUser, role: Role) {
    const previous = user.role;
    submit(() => setUserRole({ userId: user.id, role }), {
      successMessage: `${user.name ?? user.email} ahora es ${ROLE_LABELS[role]}`,
      successAction: {
        label: "Deshacer",
        onClick: () =>
          submit(() => setUserRole({ userId: user.id, role: previous }), {
            successMessage: `Rol restaurado a ${ROLE_LABELS[previous]}`,
          }),
      },
    });
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuario</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acceso</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const isSelf = user.id === currentUserId;
            const selfTitle = isSelf
              ? "No puedes modificar tu propia cuenta"
              : undefined;
            return (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <Avatar className="size-7">
                    {user.imageUrl && <AvatarImage src={user.imageUrl} />}
                    <AvatarFallback>
                      {(user.name ?? user.email).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {user.name ?? user.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell title={selfTitle}>
                <ChipSelect
                  ariaLabel={`Rol de ${user.email}`}
                  value={user.role}
                  disabled={pending || isSelf}
                  onValueChange={(role) => changeRole(user, role)}
                  options={ROLES.map((role) => ({
                    value: role,
                    label: ROLE_LABELS[role],
                  }))}
                />
              </TableCell>
              <TableCell>
                {/* §15.2: badge de tinta, jamás outline. */}
                {user.isActive ? (
                  <Badge className="rounded-full border-transparent bg-[#E6F9F1] font-extrabold text-[#069B66]">
                    Activo
                  </Badge>
                ) : (
                  <Badge className="rounded-full border-transparent bg-[#FBF7D9] font-extrabold text-[#8C7A0A]">
                    Pendiente
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant={user.isActive ? "outline" : "default"}
                  size="sm"
                  disabled={pending || isSelf}
                  title={selfTitle}
                  onClick={() =>
                    submit(
                      () =>
                        setUserActive({
                          userId: user.id,
                          isActive: !user.isActive,
                        }),
                      {
                        successMessage: user.isActive
                          ? "Cuenta desactivada"
                          : "Cuenta activada",
                      },
                    )
                  }
                >
                  {user.isActive ? "Desactivar" : "Activar"}
                </Button>
              </TableCell>
            </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
