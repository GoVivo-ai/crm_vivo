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

function omitUpdatedAt<T extends { updatedAt: Date }>(row: T): Omit<T, "updatedAt"> {
  const rest = { ...row } as Partial<T>;
  delete rest.updatedAt;
  return rest as Omit<T, "updatedAt">;
}

export function toAccount(row: typeof accounts.$inferSelect): Account {
  return omitUpdatedAt(row);
}

export function toContact(row: typeof contacts.$inferSelect): Contact {
  return omitUpdatedAt(row);
}

export function toStage(
  row: typeof pipelineStages.$inferSelect,
): PipelineStage {
  return row;
}

export function toDeal(row: typeof deals.$inferSelect): Deal {
  return { ...omitUpdatedAt(row), amount: toNumber(row.amount) };
}

export function toProposal(row: typeof proposals.$inferSelect): Proposal {
  return { ...omitUpdatedAt(row), amount: toNumber(row.amount) };
}

export function toActivity(row: typeof activities.$inferSelect): Activity {
  return row;
}
