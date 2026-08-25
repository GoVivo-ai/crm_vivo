/**
 * Parser del Spotlight (§12.6): `{tipo} {entidad} {monto} [fecha]`.
 * Puro y sin dependencias — lo interpretado SIEMPRE se muestra antes
 * de guardar; la barra jamás guarda a ciegas.
 */

export type SpotlightType = "invoice" | "expense" | "payroll" | "transaction";

export type SpotlightEntity = { id: string; name: string };

export type SpotlightCatalog = {
  /** Cuentas CRM (factura). */
  accounts: SpotlightEntity[];
  /** Personas del equipo (nómina). */
  employees: SpotlightEntity[];
  /** Cuentas bancarias (movimiento). */
  bankAccounts: SpotlightEntity[];
};

export const TYPE_DEFS: {
  key: SpotlightType;
  letter: string;
  words: string[];
  label: string;
}[] = [
  { key: "invoice", letter: "F", words: ["factura"], label: "factura" },
  { key: "expense", letter: "G", words: ["gasto"], label: "gasto" },
  { key: "payroll", letter: "N", words: ["nomina", "nómina"], label: "nómina" },
  {
    key: "transaction",
    letter: "M",
    words: ["movimiento", "saldo"],
    label: "movimiento",
  },
];

const MONTHS: Record<string, number> = {
  ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6,
  jul: 7, ago: 8, sep: 9, set: 9, oct: 10, nov: 11, dic: 12,
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** "14.6"→14.600.000 · "890k"→890.000 · "2.4m"→2.400.000 ·
 * "14.600.000"/"1450000"→literal. Regla: sin sufijo y <1000 = millones. */
export function parseAmountToken(token: string): number | null {
  const t = token.replace(/^\$/, "");
  if (/^\d{1,3}(\.\d{3})+$/.test(t)) return Number(t.replaceAll(".", ""));
  const m = /^(\d+(?:[.,]\d+)?)([km])?$/i.exec(t);
  if (!m) return null;
  const n = Number(m[1].replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  const suffix = m[2]?.toLowerCase();
  if (suffix === "k") return Math.round(n * 1_000);
  if (suffix === "m") return Math.round(n * 1_000_000);
  return n < 1000 ? Math.round(n * 1_000_000) : Math.round(n);
}

function isoFrom(today: string, day: number, month: number, year?: number) {
  const y = year ?? Number(today.slice(0, 4));
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

export function shiftDays(today: string, days: number): string {
  const d = new Date(`${today}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Fecha natural al final del texto: "hoy", "ayer", "15 sep", "15/09". */
function takeDate(
  tokens: string[],
  today: string,
): { date: string | null; rest: string[] } {
  const last = normalize(tokens[tokens.length - 1] ?? "");
  if (last === "hoy") return { date: today, rest: tokens.slice(0, -1) };
  if (last === "ayer")
    return { date: shiftDays(today, -1), rest: tokens.slice(0, -1) };
  const slash = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/.exec(last);
  if (slash) {
    return {
      date: isoFrom(
        today,
        Number(slash[1]),
        Number(slash[2]),
        slash[3] ? Number(slash[3]) : undefined,
      ),
      rest: tokens.slice(0, -1),
    };
  }
  const month = MONTHS[last.slice(0, 3)];
  const dayTok = tokens[tokens.length - 2];
  if (month && dayTok && /^\d{1,2}$/.test(dayTok)) {
    return {
      date: isoFrom(today, Number(dayTok), month),
      rest: tokens.slice(0, -2),
    };
  }
  return { date: null, rest: tokens };
}

/** Fuzzy contra el catálogo: todas las palabras de la consulta deben
 * aparecer como substring del nombre. Orden: prefijo primero. */
export function matchEntities(
  query: string,
  entities: SpotlightEntity[],
): SpotlightEntity[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  return entities
    .filter((e) => {
      const name = normalize(e.name);
      return words.every((w) => name.includes(w));
    })
    .sort((a, b) => {
      const ap = normalize(a.name).startsWith(words[0]) ? 0 : 1;
      const bp = normalize(b.name).startsWith(words[0]) ? 0 : 1;
      return ap - bp || a.name.localeCompare(b.name);
    });
}

export type ParsedCommand = {
  type: SpotlightType | null;
  /** Texto de entidad tal como se escribió (proveedor libre en gasto). */
  entityText: string;
  entityMatches: SpotlightEntity[];
  amount: number | null;
  /** ISO si el texto trae fecha; null = usar el default del tipo. */
  date: string | null;
  /** Partes entendidas, para la línea "Entendido del texto: …". */
  understood: string[];
};

export function parseCommand(
  input: string,
  catalog: SpotlightCatalog,
  today: string,
): ParsedCommand {
  const tokens = input.trim().split(/\s+/).filter(Boolean);
  const first = normalize(tokens[0] ?? "");
  const def = TYPE_DEFS.find(
    (d) =>
      first === d.letter.toLowerCase() ||
      d.words.some((w) => normalize(w).startsWith(first) && first.length >= 3),
  );
  if (!def || tokens.length === 0) {
    return {
      type: null, entityText: "", entityMatches: [],
      amount: null, date: null, understood: [],
    };
  }

  const { date, rest } = takeDate(tokens.slice(1), today);
  let amount: number | null = null;
  const entityTokens: string[] = [];
  for (let i = rest.length - 1; i >= 0; i--) {
    const tokenAmount: number | null =
      amount === null ? parseAmountToken(rest[i]) : null;
    if (tokenAmount !== null) amount = tokenAmount;
    else entityTokens.unshift(rest[i]);
  }
  const entityText = entityTokens.join(" ");

  const pool =
    def.key === "invoice"
      ? catalog.accounts
      : def.key === "payroll"
        ? catalog.employees
        : def.key === "transaction"
          ? catalog.bankAccounts
          : [];
  const entityMatches =
    def.key === "expense" ? [] : matchEntities(entityText, pool);

  const understood = [def.label];
  if (entityText) {
    understood.push(
      def.key === "expense"
        ? "proveedor"
        : def.key === "payroll"
          ? "persona"
          : def.key === "transaction"
            ? "cuenta"
            : "cliente",
    );
  }
  if (amount !== null) understood.push("monto");
  if (date) understood.push("fecha");

  return { type: def.key, entityText, entityMatches, amount, date, understood };
}
