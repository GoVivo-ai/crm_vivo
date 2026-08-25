"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type ChipSelectOption<T extends string> = { value: T; label: string };

/**
 * Select estilizado del §12.3 con trigger compacto tipo chip (valor actual
 * + chevron) — para selects inline en tablas (p.ej. rol de usuario).
 * Panel r12 con sombra del spec; seleccionada en tinta verde + check.
 */
export function ChipSelect<T extends string>({
  options,
  value,
  onValueChange,
  ariaLabel,
  disabled = false,
}: {
  options: ChipSelectOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  ariaLabel: string;
  disabled?: boolean;
}) {
  const current = options.find((o) => o.value === value);

  return (
    <SelectPrimitive.Root
      items={options}
      value={value}
      onValueChange={(v) => onValueChange(v as T)}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        aria-label={ariaLabel}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-[#EEF1F6] px-3 py-1.5 text-[11.5px] font-bold text-foreground outline-none",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#04D98B]",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <SelectPrimitive.Value>{current?.label}</SelectPrimitive.Value>
        <SelectPrimitive.Icon>
          <ChevronDown className="size-3.5 text-[#8B99B0]" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner sideOffset={4} className="z-50">
          <SelectPrimitive.Popup className="min-w-[200px] rounded-xl border border-border bg-popover p-1.5 shadow-[0_12px_32px_-12px_rgba(1,22,64,0.25)] outline-none">
            <SelectPrimitive.List>
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  className={cn(
                    "flex cursor-default items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold outline-none",
                    "data-highlighted:bg-[#EEF1F6]",
                    "data-selected:bg-[#E6F9F1] data-selected:font-extrabold data-selected:text-[#011640]",
                  )}
                >
                  <SelectPrimitive.ItemText className="min-w-0 flex-1 truncate">
                    {option.label}
                  </SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="text-[#069B66]">
                    <Check className="size-4" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
