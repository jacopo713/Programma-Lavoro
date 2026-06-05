import type { Criticism, SeverityLevel } from "./types";

export type CriticismNavFilter =
  | { type: "all" }
  | { type: "severity"; level: SeverityLevel }
  | { type: "resolved" };

export interface CriticismNavCounts {
  monitor: number;
  moderate: number;
  grave: number;
  resolved: number;
  open: number;
}

export function countCriticismNav(items: Criticism[]): CriticismNavCounts {
  let monitor = 0;
  let moderate = 0;
  let grave = 0;
  let resolved = 0;

  for (const item of items) {
    if (item.resolved) {
      resolved += 1;
      continue;
    }
    if (item.severity === 1) monitor += 1;
    else if (item.severity === 2) moderate += 1;
    else if (item.severity === 3) grave += 1;
  }

  return {
    monitor,
    moderate,
    grave,
    resolved,
    open: monitor + moderate + grave,
  };
}

export function parseCriticismNavFilter(
  searchParams: URLSearchParams,
): CriticismNavFilter {
  if (searchParams.get("resolved") === "1") {
    return { type: "resolved" };
  }
  const raw = searchParams.get("severity");
  if (raw === "1" || raw === "2" || raw === "3") {
    return { type: "severity", level: Number(raw) as SeverityLevel };
  }
  return { type: "all" };
}

export function filterCriticisms(
  items: Criticism[],
  filter: CriticismNavFilter,
): Criticism[] {
  if (filter.type === "all") {
    return items.filter((item) => !item.resolved);
  }
  if (filter.type === "resolved") {
    return items.filter((item) => item.resolved);
  }
  return items.filter(
    (item) => !item.resolved && item.severity === filter.level,
  );
}

export function criticismFilterHref(filter: CriticismNavFilter): string {
  if (filter.type === "resolved") return "/criticita?resolved=1";
  if (filter.type === "severity") return `/criticita?severity=${filter.level}`;
  return "/criticita";
}

export function isSameCriticismFilter(
  a: CriticismNavFilter,
  b: CriticismNavFilter,
): boolean {
  if (a.type !== b.type) return false;
  if (a.type === "severity" && b.type === "severity") {
    return a.level === b.level;
  }
  return true;
}
