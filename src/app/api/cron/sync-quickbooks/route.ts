import { NextResponse } from "next/server";
import { syncQuickbooks } from "@/integrations/quickbooks/sync-quickbooks";
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
    const result = await syncQuickbooks();
    return NextResponse.json(result);
  } catch (error) {
    return cronErrorResponse(error);
  }
}
