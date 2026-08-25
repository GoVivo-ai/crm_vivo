import { NextResponse } from "next/server";
import { syncWindsor } from "@/integrations/windsor/sync-windsor";
import {
  cronErrorResponse,
  requireCronSecret,
} from "@/integrations/shared/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const denied = requireCronSecret(request);
  if (denied) return denied;
  try {
    const result = await syncWindsor();
    return NextResponse.json(result);
  } catch (error) {
    return cronErrorResponse(error);
  }
}
