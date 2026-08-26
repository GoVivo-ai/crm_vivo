"use client";

import { createContext, useContext, useEffect, useState } from "react";

/**
 * Título del detalle para el topbar (M3): las páginas con nombre propio
 * (persona, cuenta, negocio) lo registran y el breadcrumb lo usa en
 * lugar del relleno "Detalle".
 */
const PageTitleContext = createContext<{
  title: string | null;
  setTitle: (t: string | null) => void;
}>({ title: null, setTitle: () => {} });

export function PageTitleProvider({ children }: { children: React.ReactNode }) {
  const [title, setTitle] = useState<string | null>(null);
  return (
    <PageTitleContext.Provider value={{ title, setTitle }}>
      {children}
    </PageTitleContext.Provider>
  );
}

export function usePageTitle(): string | null {
  return useContext(PageTitleContext).title;
}

/** Colócalo en la página de detalle con el nombre real del objeto. */
export function CrumbTitle({ title }: { title: string }) {
  const { setTitle } = useContext(PageTitleContext);
  useEffect(() => {
    setTitle(title);
    return () => setTitle(null);
  }, [title, setTitle]);
  return null;
}
