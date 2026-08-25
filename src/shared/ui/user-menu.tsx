"use client";

import { useClerk } from "@clerk/nextjs";
import { LogOut, UserCog } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserMenuProps = {
  name: string;
  email: string;
  roleLabel: string;
  initials: string;
};

/**
 * Menú de usuario del spec §12.2 (sustituye al UserButton de Clerk, cuyo
 * interior no alcanza el sistema con appearance): cabecera idéntica a la
 * tarjeta del sidebar, ítems píldora y Cerrar sesión destructivo.
 * "Gestionar cuenta" sigue abriendo el perfil de Clerk (pantalla suya).
 */
export function UserMenu({ name, email, roleLabel, initials }: UserMenuProps) {
  const { signOut, openUserProfile } = useClerk();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Menú de usuario"
        className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-[#04D98B] to-[#F2E205] font-[family-name:var(--font-display)] text-xs font-extrabold text-[#011640] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#04D98B]"
      >
        {initials}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="flex items-center gap-2.5 px-2.5 py-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#04D98B] to-[#F2E205] font-[family-name:var(--font-display)] text-[11px] font-extrabold text-[#011640]">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-extrabold">{name}</p>
            <p className="truncate text-[10.5px] font-semibold text-muted-foreground">
              {email}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-[#04D98B]/15 px-2 py-0.5 text-[9px] font-extrabold tracking-[0.08em] text-[#069B66] uppercase">
            {roleLabel}
          </span>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => openUserProfile()}>
          <UserCog className="size-[15px] text-muted-foreground" />
          Gestionar cuenta
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => signOut({ redirectUrl: "/sign-in" })}
        >
          <LogOut className="size-[15px]" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
