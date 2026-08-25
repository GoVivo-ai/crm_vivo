import { TriangleAlert } from "lucide-react";

/** Estado de error de página cuando un Server Action retorna ok: false. */
export function ActionError({ message }: { message: string }) {
  return (
    <div className="mx-auto mt-12 flex max-w-md items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-5 text-sm">
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
      <div>
        <p className="font-medium text-destructive">No se pudo cargar la vista</p>
        <p className="mt-1 text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
