/** Numerazione voce sotto una sezione (es. 4.1, 4.2) */
export function formatCriticismNumber(
  sectionNumber: string,
  itemIndex: number,
): string {
  return `${sectionNumber}.${itemIndex}`;
}

export function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function formatDateTimeIT(date: Date): string {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDateFile(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const REPORT_DATE_WINDOW_DAYS = 30;

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function parseIsoDate(isoDate: string): Date | null {
  if (!ISO_DATE_RE.test(isoDate)) return null;
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return startOfDay(date);
}

export function toIsoDate(date: Date): string {
  return formatDateFile(startOfDay(date));
}

/** Finestra selezionabile: ultimi 30 giorni incluso oggi */
export function getReportDateWindowBounds(reference = new Date()): {
  min: Date;
  max: Date;
} {
  const max = startOfDay(reference);
  const min = new Date(max);
  min.setDate(min.getDate() - (REPORT_DATE_WINDOW_DAYS - 1));
  return { min, max };
}

export function isReportDateInWindow(
  isoDate: string,
  reference = new Date(),
): boolean {
  const date = parseIsoDate(isoDate);
  if (!date) return false;
  const { min, max } = getReportDateWindowBounds(reference);
  return date >= min && date <= max;
}

/** Normalizza una data di redazione: accetta solo YYYY-MM-DD, altrimenti "" */
export function normalizeReportDate(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return ISO_DATE_RE.test(trimmed) ? trimmed : "";
}

/** Converte una data ISO YYYY-MM-DD in DD/MM/YYYY (vuoto se non valida) */
export function formatReportDateIT(isoDate: string): string {
  if (!ISO_DATE_RE.test(isoDate)) return "";
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}
