import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextResponse, type NextRequest } from "next/server";
import {
  deactivateUserByClerkId,
  upsertUserFromClerk,
} from "@/modules/identity/infrastructure/users-repository";

export async function POST(request: NextRequest) {
  let event;
  try {
    event = await verifyWebhook(request);
  } catch {
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } =
      event.data;
    const email = email_addresses[0]?.email_address;
    if (!email) {
      return NextResponse.json({ error: "Usuario sin email" }, { status: 422 });
    }
    const name =
      [first_name, last_name].filter(Boolean).join(" ") || null;
    await upsertUserFromClerk({
      clerkId: id,
      email,
      name,
      imageUrl: image_url ?? null,
    });
  } else if (event.type === "user.deleted" && event.data.id) {
    await deactivateUserByClerkId(event.data.id);
  }

  return NextResponse.json({ received: true });
}
