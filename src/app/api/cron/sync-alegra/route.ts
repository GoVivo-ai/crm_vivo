import { NextResponse } from "next/server";
import { syncAlegra } from "@/integrations/alegra/sync-alegra";
import {
  cronErrorResponse,
  requireCronSecret,
} from "@/integrations/shared/cron-auth";

export const dynamic = "force-dynamic";
// Backfill inicial por lotes: requiere plan Pro de Vercel (maxDuration 300).
export const maxDuration = 300;

export async function GET(request: Request) {
  const denied = requireCronSecret(request);
  if (denied) return denied;
  try {
    const result = await syncAlegra();
    return NextResponse.json(result);
  } catch (error) {
    return cronErrorResponse(error);
  }
}
