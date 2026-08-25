// Tipos de dominio del CRM expuestos a la UI — nunca filas Drizzle crudas.

export type AccountStatus = "prospect" | "active" | "paused" | "churned";
export type ProposalStatus = "draft" | "sent" | "accepted" | "rejected";
export type ActivityType = "call" | "meeting" | "email" | "task" | "note";

export type Account = {
  id: string;
  name: string;
  nit: string | null;
  industry: string | null;
  website: string | null;
  status: AccountStatus;
  ownerId: string | null;
  billingCustomerId: string | null;
  clickupFolderId: string | null;
  notes: string | null;
  createdAt: Date;
};

export type Contact = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  accountId: string | null;
  ownerId: string | null;
  notes: string | null;
  createdAt: Date;
};

export type PipelineStage = {
  id: string;
  name: string;
  position: number;
  probability: number;
  isWon: boolean;
  isLost: boolean;
};

export type Deal = {
  id: string;
  title: string;
  accountId: string;
  contactId: string | null;
  stageId: string;
  ownerId: string | null;
  amount: number | null;
  currency: string;
  expectedCloseDate: string | null; // YYYY-MM-DD
  position: number;
  /** Cuándo entró a la etapa actual — para "días en etapa" del Kanban. */
  stageEnteredAt: Date;
  closedAt: Date | null;
  createdAt: Date;
};

export type Proposal = {
  id: string;
  dealId: string;
  title: string;
  url: string | null;
  status: ProposalStatus;
  amount: number | null;
  sentAt: Date | null;
  createdAt: Date;
};

export type Activity = {
  id: string;
  type: ActivityType;
  subject: string;
  content: string | null;
  dueDate: Date | null;
  completedAt: Date | null;
  dealId: string | null;
  contactId: string | null;
  accountId: string | null;
  ownerId: string | null;
  createdAt: Date;
};

/** Tablero Kanban: etapas ordenadas con sus deals ordenados por position. */
export type PipelineBoard = {
  stages: Array<PipelineStage & { deals: Deal[] }>;
};
