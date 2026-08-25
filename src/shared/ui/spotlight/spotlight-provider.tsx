"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { listAccountOptionsForInvoicing } from "@/modules/finance/application/account-options-action";
import { getTeamDirectory } from "@/modules/people/application/team-actions";
import { listBankAccountOptions } from "@/modules/treasury/application/treasury-actions";
import type { SpotlightCatalog, SpotlightType } from "./parser";
import { SpotlightOverlay } from "./spotlight-overlay";

const SpotlightContext = createContext<{
  openSpotlight: () => void;
  /** false = el rol no puede registrar nada (se oculta el botón). */
  enabled: boolean;
}>({ openSpotlight: () => {}, enabled: false });

export function useSpotlight() {
  return useContext(SpotlightContext);
}

const EMPTY: SpotlightCatalog = { accounts: [], employees: [], bankAccounts: [] };

/**
 * Capa global del Spotlight (§12.6): Cmd/Ctrl+K desde cualquier módulo,
 * salvo con otro overlay abierto. Los catálogos (clientes, personas,
 * cuentas) se cargan una vez, al primer uso, vía server actions.
 */
export function SpotlightProvider({
  allowed,
  today,
  children,
}: {
  /** Tipos con permiso de escritura del rol actual. */
  allowed: SpotlightType[];
  /** Hoy YYYY-MM-DD (server) para fechas naturales. */
  today: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [catalog, setCatalog] = useState<SpotlightCatalog>(EMPTY);
  const loadedRef = useRef(false);

  const loadCatalog = useCallback(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    void Promise.all([
      listAccountOptionsForInvoicing(),
      getTeamDirectory(),
      listBankAccountOptions(),
    ]).then(([accountsR, teamR, treasuryR]) => {
      setCatalog({
        accounts: accountsR.ok
          ? accountsR.data.map(({ id, name }) => ({ id, name }))
          : [],
        employees: teamR.ok
          ? teamR.data
              .filter((m) => m.active)
              .map((m) => ({ id: m.id, name: m.fullName }))
          : [],
        bankAccounts: treasuryR.ok
          ? treasuryR.data.map(({ id, name }) => ({ id, name }))
          : [],
      });
    });
  }, []);

  const openSpotlight = useCallback(() => {
    if (allowed.length === 0) return;
    loadCatalog();
    setOpen(true);
  }, [allowed.length, loadCatalog]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== "k" || !(e.metaKey || e.ctrlKey)) return;
      e.preventDefault();
      if (open) return;
      // Con otro overlay abierto (dialog Lomo, confirm) el atajo no aplica.
      if (document.querySelector('[role="dialog"], [role="alertdialog"]'))
        return;
      openSpotlight();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, openSpotlight]);

  return (
    <SpotlightContext.Provider
      value={{ openSpotlight, enabled: allowed.length > 0 }}
    >
      {children}
      {open && (
        <SpotlightOverlay
          catalog={catalog}
          allowed={allowed}
          today={today}
          onClose={() => setOpen(false)}
        />
      )}
    </SpotlightContext.Provider>
  );
}
