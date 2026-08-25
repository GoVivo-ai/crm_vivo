import { ModuleTabs } from "@/shared/ui/module-tabs";

export default function FinanceLayout({ children }: LayoutProps<"/finance">) {
  return (
    <div className="flex flex-col gap-4">
      <ModuleTabs
        tabs={[
          { href: "/finance", label: "Resumen" },
          { href: "/finance/invoices", label: "Facturas" },
        ]}
      />
      {children}
    </div>
  );
}
