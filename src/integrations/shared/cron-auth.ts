import { NextResponse } from "next/server";
import { toReadableSyncError } from "@/integrations/shared/errors";

/**
 * Valida `Authorization: Bearer $CRON_SECRET` en las rutas de cron.
 * Devuelve la respuesta de error a retornar, o null si está autorizado.
 */
export function requireCronSecret(request: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET no está configurado" },
      { status: 500 },
    );
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return null;
}

export function cronErrorResponse(error: unknown): NextResponse {
  // Mensaje sanitizado: nunca URLs con query ni headers (credenciales).
  return NextResponse.json(
    { error: toReadableSyncError(error) },
    { status: 500 },
  );
}
