import { ModuleTabs } from "@/shared/ui/module-tabs";

export default function PeopleLayout({ children }: LayoutProps<"/people">) {
  return (
    <div className="flex flex-col gap-4">
      <ModuleTabs
        tabs={[
          { href: "/people", label: "Directorio" },
          { href: "/people/leave", label: "Ausencias" },
        ]}
      />
      {children}
    </div>
  );
}
