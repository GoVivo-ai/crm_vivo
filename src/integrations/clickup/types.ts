export interface ClickUpTask {
  id: string;
  name: string;
  status: {
    status: string;
    /** "open" | "custom" | "done" | "closed" */
    type: string;
  };
  /** Epoch millis como string, o null. */
  due_date: string | null;
  date_updated: string;
}

export interface ClickUpTasksPage {
  tasks: ClickUpTask[];
  last_page: boolean;
}

/** Resumen que se persiste en projects.synced_progress (JSONB). */
export interface ProjectProgress {
  total: number;
  done: number;
  inProgress: number;
  open: number;
  overdue: number;
  completionPct: number;
  byStatus: Record<string, number>;
  syncedAt: string;
}
