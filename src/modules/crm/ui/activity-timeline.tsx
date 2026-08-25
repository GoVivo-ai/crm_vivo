import { Mail, NotebookPen, Phone, SquareCheck, Users } from "lucide-react";
import type { Activity, ActivityType } from "@/modules/crm/domain/types";
import { ACTIVITY_TYPE_LABELS } from "@/modules/crm/ui/labels";
import { formatDate, formatRelativeTime } from "@/shared/ui/format";

const TYPE_ICONS: Record<ActivityType, typeof Phone> = {
  call: Phone,
  meeting: Users,
  email: Mail,
  task: SquareCheck,
  note: NotebookPen,
};

/** Timeline vertical de actividades de un deal, la más reciente arriba. */
export function ActivityTimeline({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Sin actividades todavía. Registra la primera llamada, reunión o nota.
      </p>
    );
  }

  return (
    <ol className="relative flex flex-col gap-4 border-l pl-5">
      {activities.map((activity) => {
        const Icon = TYPE_ICONS[activity.type];
        return (
          <li key={activity.id} className="relative">
            <span className="absolute top-0.5 -left-[27.5px] grid size-5 place-items-center rounded-full border bg-card">
              <Icon className="size-3 text-muted-foreground" />
            </span>
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-xs text-muted-foreground">
                {ACTIVITY_TYPE_LABELS[activity.type]}
              </span>
              <p className="text-sm font-medium">{activity.subject}</p>
              <span
                className="ml-auto text-xs text-muted-foreground"
                title={formatDate(activity.createdAt)}
              >
                {formatRelativeTime(activity.createdAt)}
              </span>
            </div>
            {activity.content && (
              <p className="mt-1 text-sm whitespace-pre-wrap text-muted-foreground">
                {activity.content}
              </p>
            )}
            {activity.dueDate && activity.completedAt === null && (
              <p className="mt-1 text-xs text-health-warn">
                Vence {formatDate(activity.dueDate)}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
