import { ModuleTabs } from "@/shared/ui/module-tabs";

export default function MarketingLayout({
  children,
}: LayoutProps<"/marketing">) {
  return (
    <div className="flex flex-col gap-4">
      <ModuleTabs
        tabs={[
          { href: "/marketing", label: "Dashboard" },
          { href: "/marketing/accounts", label: "Cuentas de ads" },
        ]}
      />
      {children}
    </div>
  );
}
