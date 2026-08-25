import Image from "next/image";

type EmptyStateProps = {
  title: string;
  /** Qué hacer para que deje de estar vacío — una invitación, no un lamento. */
  hint: string;
  /** Acción opcional (botón/dialog) que resuelve el vacío aquí mismo. */
  action?: React.ReactNode;
};

/** Estado vacío de marca: el isotipo VIVO acompaña la invitación a actuar. */
export function EmptyState({ title, hint, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card/60 px-6 py-12 text-center">
      <Image
        src="/brand/logomark-blue.png"
        alt=""
        width={44}
        height={32}
        className="opacity-30"
      />
      <p className="font-[family-name:var(--font-display)] text-base font-bold">
        {title}
      </p>
      <p className="max-w-sm text-sm text-muted-foreground">{hint}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
