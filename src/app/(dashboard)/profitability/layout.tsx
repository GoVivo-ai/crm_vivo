import { ModuleTabs } from "@/shared/ui/module-tabs";

export default function ProfitabilityLayout({
  children,
}: LayoutProps<"/profitability">) {
  return (
    <div className="flex flex-col gap-4">
      <ModuleTabs
        tabs={[
          { href: "/profitability", label: "Margen por cliente" },
          { href: "/profitability/staffing", label: "Asignaciones" },
        ]}
      />
      {children}
    </div>
  );
}
