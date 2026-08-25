import type {
  accounts,
  activities,
  contacts,
  deals,
  pipelineStages,
  proposals,
} from "@/modules/crm/schema";
import type {
  Account,
  Activity,
  Contact,
  Deal,
  PipelineStage,
  Proposal,
} from "@/modules/crm/domain/types";

const toNumber = (v: string | null) => (v === null ? null : Number(v));

export function toAccount(row: typeof accounts.$inferSelect): Account {
  const { updatedAt: _updatedAt, ...rest } = row;
  return rest;
}

export function toContact(row: typeof contacts.$inferSelect): Contact {
  const { updatedAt: _updatedAt, ...rest } = row;
  return rest;
}

export function toStage(
  row: typeof pipelineStages.$inferSelect,
): PipelineStage {
  return row;
}

export function toDeal(row: typeof deals.$inferSelect): Deal {
  const { updatedAt: _updatedAt, ...rest } = row;
  return { ...rest, amount: toNumber(row.amount) };
}

export function toProposal(row: typeof proposals.$inferSelect): Proposal {
  const { updatedAt: _updatedAt, ...rest } = row;
  return { ...rest, amount: toNumber(row.amount) };
}

export function toActivity(row: typeof activities.$inferSelect): Activity {
  return row;
}
