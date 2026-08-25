"use client";

import dynamic from "next/dynamic";

// three entra por dynamic import sin SSR: jamás toca el critical path.
const BrandScene = dynamic(() => import("@/shared/ui/brand-scene"), {
  ssr: false,
});

/** Fondo de marca para superficies de bienvenida (sign-in / sign-up). */
export function BrandBackdrop() {
  return <BrandScene />;
}
