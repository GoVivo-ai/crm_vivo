/**
 * Estado vacío de un chart (M5): mensaje honesto en el hueco del chart,
 * jamás ejes falsos ni un blanco absoluto. Mismo tono que PnlTable.
 */
export function ChartEmpty({ text, hint }: { text: string; hint?: string }) {
  return (
    <div className="flex h-56 w-full flex-col items-center justify-center gap-1 rounded-lg bg-[#F6F7F9] px-6 text-center">
      <p className="text-sm font-bold text-[#5A6B85]">{text}</p>
      {hint && (
        <p className="text-xs font-semibold text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
