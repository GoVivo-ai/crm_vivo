import { ModuleTabs } from "@/shared/ui/module-tabs";

export default function CrmLayout({ children }: LayoutProps<"/crm">) {
  return (
    <div className="flex flex-col gap-4">
      <ModuleTabs
        tabs={[
          { href: "/crm/pipeline", label: "Pipeline" },
          { href: "/crm/contacts", label: "Contactos" },
          { href: "/crm/accounts", label: "Cuentas" },
        ]}
      />
      {children}
    </div>
  );
}
