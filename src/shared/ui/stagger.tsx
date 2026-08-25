"use client";

import { motion, useReducedMotion } from "motion/react";
import { Children } from "react";

/**
 * Entrada escalonada de los paneles del home — el único momento de motion
 * de la pantalla. Con reduced-motion no anima nada.
 */
export function StaggerIn({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const items = Children.toArray(children);

  if (reduced) return <>{children}</>;

  return (
    <>
      {items.map((child, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.05 + i * 0.07,
            duration: 0.45,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {child}
        </motion.div>
      ))}
    </>
  );
}
