import { Badge } from "@/components/ui/badge";
import type { RecordSource } from "@/modules/finance/domain/types";

/** Chip de fuente (§15.2, tinta b-mut — jamás outline): manual
 * (editable) o QuickBooks (solo lectura). */
export function SourceBadge({ source }: { source: RecordSource }) {
  if (source === "manual") {
    return (
      <Badge className="rounded-full border-transparent bg-[#EEF1F6] font-extrabold text-[#5A6B85]">
        Manual
      </Badge>
    );
  }
  return (
    <Badge
      className="rounded-full border-transparent bg-[#E6F9F1] font-extrabold text-[#069B66]"
      title="Sincronizado desde QuickBooks — solo lectura"
    >
      QuickBooks
    </Badge>
  );
}
