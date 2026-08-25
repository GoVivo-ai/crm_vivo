import type {
  ContractType,
  EmployeeDetail,
  EmployeeDocument,
} from "@/modules/people/domain/types";
import type { EmployeeInput } from "@/modules/people/domain/validation";

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  termino_fijo: "Término fijo",
  indefinido: "Indefinido",
  prestacion_servicios: "Prestación de servicios",
  obra_labor: "Obra o labor",
};

/** "CC ····4821" — el documento completo solo tras write (§14). */
export function maskIdentification(id: string): string {
  const digits = id.replace(/\D/g, "");
  const tail = digits.slice(-4) || id.slice(-4);
  return `CC ····${tail}`;
}

const MONTHS_ES = "ene feb mar abr may jun jul ago sep oct nov dic".split(" ");

/** ISO → "14 mar 1994" (sin Date en cliente: string puro). */
export function formatIsoDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS_ES[m - 1] ?? m} ${y}`;
}

/** ISO → "sep 2024" (fecha de subida en la checklist). */
export function formatMonthYear(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return `${MONTHS_ES[m - 1] ?? m} ${y}`;
}

/** {day, month} → "14 mar" — cumpleaños sin año (minimización PII). */
export function formatDayMonth(b: { day: number; month: number }): string {
  return `${b.day} ${MONTHS_ES[b.month - 1] ?? b.month}`;
}

export function daysUntil(iso: string, today: string): number {
  return Math.floor((Date.parse(iso) - Date.parse(today)) / 86_400_000);
}

/** Antigüedad "1 a · 11 m" desde el ingreso. */
export function seniorityLabel(hiredAt: string, today: string): string {
  const [hy, hm] = hiredAt.split("-").map(Number);
  const [ty, tm] = today.split("-").map(Number);
  const months = Math.max(0, (ty - hy) * 12 + (tm - hm));
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m} m`;
  return `${y} a · ${m} m`;
}

/** EmployeeDetail → input completo del schema. Las ediciones por
 * sección parten de aquí y pisan SOLO sus campos — el update es de
 * documento completo y esto evita borrar el resto. */
export function toEmployeeInput(d: EmployeeDetail): EmployeeInput {
  return {
    fullName: d.fullName,
    identification: d.identification,
    email: d.email,
    phone: d.phone,
    hiredAt: d.hiredAt,
    position: d.position,
    area: d.area,
    active: d.active,
    contractType: d.contractType,
    contractEndDate: d.contractEndDate,
    workSchedule: d.workSchedule,
    eps: d.eps,
    afp: d.afp,
    arl: d.arl,
    cajaCompensacion: d.cajaCompensacion,
    birthDate: d.birthDate,
    address: d.address,
    emergencyContactName: d.emergencyContactName,
    emergencyContactPhone: d.emergencyContactPhone,
    bloodType: d.bloodType,
    shirtSize: d.shirtSize,
    pantsSize: d.pantsSize,
    shoeSize: d.shoeSize,
    documents: d.documents,
    annualLeaveDays: d.annualLeaveDays,
    userId: d.userId,
    notes: d.notes,
  };
}

/** Lista canónica del §14 — extensible por tipo de contrato. */
export type ChecklistItem = {
  label: string;
  /** Palabras que la identifican en el nombre del documento subido. */
  keywords: string[];
  doc: EmployeeDocument | null;
};

const CANONICAL: Omit<ChecklistItem, "doc">[] = [
  { label: "Hoja de vida", keywords: ["hoja de vida", "cv", "curricul"] },
  { label: "Cédula", keywords: ["cedula", "documento de identidad"] },
  { label: "Certificados de afiliación", keywords: ["afiliacion"] },
  { label: "Acuerdo de confidencialidad", keywords: ["confidencialidad", "nda"] },
  { label: "Contrato firmado", keywords: ["contrato"] },
  { label: "Examen médico de ingreso", keywords: ["examen", "medico"] },
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Cruza los documentos subidos con la lista canónica (§14). */
export function computeChecklist(documents: EmployeeDocument[]): {
  items: ChecklistItem[];
  done: number;
  total: number;
} {
  const items = CANONICAL.map((c) => ({
    ...c,
    doc:
      documents.find((doc) =>
        c.keywords.some((k) => normalize(doc.name).includes(normalize(k))),
      ) ?? null,
  }));
  return {
    items,
    done: items.filter((i) => i.doc !== null).length,
    total: items.length,
  };
}
