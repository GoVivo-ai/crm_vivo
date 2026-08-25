type ModulePlaceholderProps = {
  title: string;
  phase: string;
  description: string;
};

/** Estado vacío honesto para módulos aún no construidos. */
export function ModulePlaceholder({
  title,
  phase,
  description,
}: ModulePlaceholderProps) {
  return (
    <section className="mx-auto flex max-w-lg flex-col items-start gap-3 rounded-lg border bg-card p-8 mt-12">
      <span className="rounded-sm bg-secondary px-2 py-0.5 font-mono text-xs text-secondary-foreground">
        {phase}
      </span>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-sm text-muted-foreground">{description}</p>
    </section>
  );
}
