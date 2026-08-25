import { ModuleTabs } from "@/shared/ui/module-tabs";

export default function PurchasesLayout({
  children,
}: LayoutProps<"/purchases">) {
  return (
    <div className="flex flex-col gap-4">
      <ModuleTabs
        tabs={[
          { href: "/purchases", label: "Dashboard" },
          { href: "/purchases/expenses", label: "Registrados" },
        ]}
      />
      {children}
    </div>
  );
}
