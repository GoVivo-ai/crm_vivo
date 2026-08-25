import { Badge } from "@/components/ui/badge";
import type { RecordSource } from "@/modules/finance/domain/types";

/** Fuente del registro: manual (editable) o QuickBooks (solo lectura). */
export function SourceBadge({ source }: { source: RecordSource }) {
  if (source === "manual") {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Manual
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="border-[#2CA01C]/30 bg-[#2CA01C]/10 text-[#1d7a13]"
      title="Sincronizado desde QuickBooks — solo lectura"
    >
      QuickBooks
    </Badge>
  );
}
