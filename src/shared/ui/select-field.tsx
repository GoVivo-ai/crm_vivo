"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export type SelectFieldOption = { value: string; label: string };

/**
 * Select de formulario del §12.3: trigger = input r10 con chevron;
 * panel como menú; seleccionada en tinta verde + navy 800 + check.
 * Lleva un input hidden con `name` para viajar en el FormData.
 */
export function SelectField({
  name,
  options,
  defaultValue = "",
  ariaLabel,
  emptyLabel = "—",
}: {
  name: string;
  options: SelectFieldOption[];
  defaultValue?: string;
  ariaLabel: string;
  /** Rótulo de la opción vacía (valor ""). */
  emptyLabel?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const all: SelectFieldOption[] = [
    { value: "", label: emptyLabel },
    ...options,
  ];
  const current = all.find((o) => o.value === value);

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <SelectPrimitive.Root
        items={all}
        value={value}
        onValueChange={(v) => setValue((v as string) ?? "")}
      >
        <SelectPrimitive.Trigger
          aria-label={ariaLabel}
          className={cn(
            "flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-[10px] border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-[popup-open]:border-ring data-[popup-open]:ring-3 data-[popup-open]:ring-ring/50",
          )}
        >
          <SelectPrimitive.Value
            className={cn(value === "" && "text-muted-foreground")}
          >
            {current?.label}
          </SelectPrimitive.Value>
          <SelectPrimitive.Icon>
            <ChevronDown className="size-4 text-[#8B99B0]" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Positioner sideOffset={4} className="z-50">
            <SelectPrimitive.Popup className="max-h-64 min-w-[200px] overflow-y-auto rounded-xl border border-border bg-popover p-1.5 shadow-[0_12px_32px_-12px_rgba(1,22,64,0.25)] outline-none">
              <SelectPrimitive.List>
                {all.map((option) => (
                  <SelectPrimitive.Item
                    key={option.value}
                    value={option.value}
                    className={cn(
                      "flex cursor-default items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold outline-none",
                      "data-highlighted:bg-[#EEF1F6]",
                      // Selected GANA a highlighted (§12.3): mismo peso CSS, decide el orden — important.
                    "data-selected:bg-[#E6F9F1]! data-selected:font-extrabold! data-selected:text-[#011640]!",
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
    </>
  );
}
