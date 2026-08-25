import { resilientFetch } from "@/shared/http/resilient-fetch";
import { PACE_MS, sleep } from "@/integrations/shared/paced";
import type {
  ClickUpTask,
  ClickUpTasksPage,
} from "@/integrations/clickup/types";

const BASE_URL = "https://api.clickup.com/api/v2";
/** Tope defensivo: ninguna lista de la agencia se acerca a 20 páginas. */
const MAX_TASK_PAGES = 20;

function authHeader(): string {
  const token = process.env.CLICKUP_TOKEN;
  if (!token) {
    throw new Error("Falta CLICKUP_TOKEN");
  }
  return token;
}

async function clickupGet<T>(
  path: string,
  params: Record<string, string> = {},
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const response = await resilientFetch(url.toString(), {
    headers: { Authorization: authHeader(), Accept: "application/json" },
  });
  return (await response.json()) as T;
}

/** Todas las tareas de una lista (paginado secuencial, incluye cerradas). */
export async function fetchListTasks(listId: string): Promise<ClickUpTask[]> {
  const tasks: ClickUpTask[] = [];
  for (let page = 0; page < MAX_TASK_PAGES; page++) {
    if (page > 0) await sleep(PACE_MS);
    const body = await clickupGet<ClickUpTasksPage>(`/list/${listId}/task`, {
      page: String(page),
      include_closed: "true",
      subtasks: "true",
    });
    tasks.push(...body.tasks);
    if (body.last_page || body.tasks.length === 0) break;
  }
  return tasks;
}
