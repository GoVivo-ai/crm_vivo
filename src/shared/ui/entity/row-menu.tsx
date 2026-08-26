"use client";

import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Menú contextual ⋯ de fila (§15.2/§12.2): las acciones por registro
 * salen de la fila y viven aquí. Los items van como children
 * (DropdownMenuItem del §12.2).
 */
export function RowMenu({
  label,
  children,
}: {
  /** Nombre del registro para el aria-label ("Acciones de FV-2041"). */
  label: string;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Acciones de ${label}`}
        className="relative z-10 grid size-7 place-items-center rounded-full text-[#8B99B0] outline-none hover:bg-[#EEF1F6] hover:text-foreground focus-visible:outline-2 focus-visible:outline-[#04D98B]"
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}
