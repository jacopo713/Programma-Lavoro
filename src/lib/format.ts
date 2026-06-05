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
