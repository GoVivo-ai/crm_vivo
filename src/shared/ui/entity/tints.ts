/** Tintas de área del §2 — rotación estable para tiles de identidad. */
export const ENTITY_TINTS = [
  { bg: "#E6F9F1", fg: "#069B66" }, // verde
  { bg: "#E8F0FB", fg: "#1E5FBF" }, // azul
  { bg: "#FBF7D9", fg: "#8C7A0A" }, // gold
  { bg: "#E7EBF3", fg: "#011640" }, // navy
] as const;

/** Tinta determinista por entidad (mismo id → misma tinta siempre). */
export function tintFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return ENTITY_TINTS[Math.abs(h) % ENTITY_TINTS.length];
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
