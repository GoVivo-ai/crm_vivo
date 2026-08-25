"use client";

import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type ComboOption = { id: string; name: string };

/**
 * Combobox del spec §12.3 para listas dinámicas (clientes, personas,
 * cuentas): trigger = input r10 con chevron; el input ES la búsqueda;
 * opción seleccionada en tinta verde + navy 800 + check.
 */
export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Buscar…",
  ariaLabel,
  required = false,
  defaultOpen = false,
}: {
  options: ComboOption[];
  value: string | null;
  onValueChange: (id: string | null) => void;
  placeholder?: string;
  ariaLabel: string;
  required?: boolean;
  /** Abierto al montar — ambigüedad del Spotlight (§12.6). */
  defaultOpen?: boolean;
}) {
  const selected = options.find((o) => o.id === value) ?? null;

  return (
    <ComboboxPrimitive.Root
      defaultOpen={defaultOpen}
      items={options}
      itemToStringLabel={(item: ComboOption | null) => item?.name ?? ""}
      value={selected}
      onValueChange={(item: ComboOption | null) =>
        onValueChange(item?.id ?? null)
      }
    >
      <div className="relative">
        <ComboboxPrimitive.Input
          aria-label={ariaLabel}
          placeholder={placeholder}
          required={required}
          className="h-9 w-full min-w-0 rounded-[10px] border border-input bg-transparent px-3 pr-8 py-1 text-sm shadow-xs transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <ComboboxPrimitive.Trigger
          aria-label={`Abrir ${ariaLabel}`}
          className="absolute inset-y-0 right-0 grid w-8 place-items-center text-[#8B99B0]"
        >
          <ChevronDown className="size-4" />
        </ComboboxPrimitive.Trigger>
      </div>
      <ComboboxPrimitive.Portal>
        <ComboboxPrimitive.Positioner sideOffset={4} className="z-50">
          <ComboboxPrimitive.Popup className="max-h-64 w-(--anchor-width) min-w-[200px] overflow-y-auto rounded-xl border border-border bg-popover p-1.5 shadow-[0_12px_32px_-12px_rgba(1,22,64,0.25)] outline-none">
            <ComboboxPrimitive.Empty className="px-3 py-2 text-[13px] font-semibold text-muted-foreground">
              Sin resultados.
            </ComboboxPrimitive.Empty>
            <ComboboxPrimitive.List>
              {(item: ComboOption) => (
                <ComboboxPrimitive.Item
                  key={item.id}
                  value={item}
                  className={cn(
                    "flex cursor-default items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold outline-none",
                    "data-highlighted:bg-[#EEF1F6]",
                    "data-selected:bg-[#E6F9F1] data-selected:font-extrabold data-selected:text-[#011640]",
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{item.name}</span>
                  <ComboboxPrimitive.ItemIndicator className="text-[#069B66]">
                    <Check className="size-4" />
                  </ComboboxPrimitive.ItemIndicator>
                </ComboboxPrimitive.Item>
              )}
            </ComboboxPrimitive.List>
          </ComboboxPrimitive.Popup>
        </ComboboxPrimitive.Positioner>
      </ComboboxPrimitive.Portal>
    </ComboboxPrimitive.Root>
  );
}
