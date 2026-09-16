/**
 * Tinta de los tiles de identidad (avatares de iniciales).
 *
 * Antes rotaba cuatro tintas de área (verde/azul/oro/navy) por hash del id, así
 * que una tabla de 30 filas eran 30 avatares en cuatro colores: color decorativo,
 * sin significado, multiplicado por el número de filas. La regla de marca de VIVO
 * es que el gris manda y el navy acentúa, así que el tile es uno solo: relleno
 * neutro con iniciales navy.
 */
export const ENTITY_TINT = { bg: "var(--fill)", fg: "var(--primary)" } as const;

/** Tinta del tile de identidad. Única — ya no depende de la entidad. */
export function tintFor() {
  return ENTITY_TINT;
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
