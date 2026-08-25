import { ModuleTabs } from "@/shared/ui/module-tabs";

export default function SettingsLayout({ children }: LayoutProps<"/settings">) {
  return (
    <div className="flex flex-col gap-4">
      <ModuleTabs
        tabs={[
          { href: "/settings", label: "Usuarios" },
          { href: "/settings/integrations", label: "Integraciones" },
        ]}
      />
      {children}
    </div>
  );
}
