import { desc, eq } from "drizzle-orm";
import { db } from "@/shared/database/db";
import { activities, proposals } from "@/modules/crm/schema";
import type { Activity, Proposal } from "@/modules/crm/domain/types";
import type {
  ActivityInput,
  ProposalInput,
} from "@/modules/crm/domain/validation";
import { toActivity, toProposal } from "@/modules/crm/infrastructure/mappers";

export async function listActivitiesByDeal(
  dealId: string,
): Promise<Activity[]> {
  const rows = await db
    .select()
    .from(activities)
    .where(eq(activities.dealId, dealId))
    .orderBy(desc(activities.createdAt))
    .limit(500);
  return rows.map(toActivity);
}

export async function insertActivity(
  input: ActivityInput,
  ownerId: string,
): Promise<Activity> {
  const rows = await db
    .insert(activities)
    .values({
      type: input.type,
      subject: input.subject,
      content: input.content ?? null,
      dueDate: input.dueDate ?? null,
      dealId: input.dealId ?? null,
      contactId: input.contactId ?? null,
      accountId: input.accountId ?? null,
      ownerId,
    })
    .returning();
  return toActivity(rows[0]);
}

export async function listProposalsByDeal(
  dealId: string,
): Promise<Proposal[]> {
  const rows = await db
    .select()
    .from(proposals)
    .where(eq(proposals.dealId, dealId))
    .orderBy(desc(proposals.createdAt));
  return rows.map(toProposal);
}

export async function insertProposal(input: ProposalInput): Promise<Proposal> {
  const rows = await db
    .insert(proposals)
    .values({
      dealId: input.dealId,
      title: input.title,
      url: input.url || null,
      status: input.status,
      amount: input.amount != null ? String(input.amount) : null,
      sentAt: input.status === "sent" ? new Date() : null,
    })
    .returning();
  return toProposal(rows[0]);
}
