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
import { NativeSelect } from "@/shared/ui/native-select";
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
              <TableCell>
                <NativeSelect
                  aria-label={`Rol de ${user.email}`}
                  value={user.role}
                  disabled={pending || isSelf}
                  title={selfTitle}
                  className="w-40"
                  onChange={(e) =>
                    submit(
                      () =>
                        setUserRole({
                          userId: user.id,
                          role: e.target.value as Role,
                        }),
                      { successMessage: "Rol actualizado" },
                    )
                  }
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </NativeSelect>
              </TableCell>
              <TableCell>
                {user.isActive ? (
                  <Badge
                    variant="outline"
                    className="border-health-ok/30 bg-health-ok/10 text-health-ok"
                  >
                    Activo
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-health-warn/30 bg-health-warn/10 text-health-warn"
                  >
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
