import { ModuleTabs } from "@/shared/ui/module-tabs";

export default function ClientsLayout({ children }: LayoutProps<"/clients">) {
  return (
    <div className="flex flex-col gap-4">
      <ModuleTabs
        tabs={[
          { href: "/clients", label: "Cuentas cliente" },
          { href: "/clients/services", label: "Servicios" },
        ]}
      />
      {children}
    </div>
  );
}
