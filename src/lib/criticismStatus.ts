import { getSeverityLabel, getSeverityReportBannerLabel } from "./severity";
import type { Criticism, SeverityLevel } from "./types";

/** Valore UI del menu criticità (non persistito come severity numerico) */
export type CriticismFormStatus = SeverityLevel | "resolved";

export const RESOLVED_STATUS_LABEL = "Risolto";
export const RESOLVED_REPORT_LABEL = "RISOLTO";

export function getFormStatus(item: Pick<Criticism, "severity" | "resolved">): CriticismFormStatus {
  if (item.resolved) return "resolved";
  return item.severity;
}

export function applyFormStatus(
  currentSeverity: SeverityLevel,
  status: CriticismFormStatus,
): { severity: SeverityLevel; resolved: boolean } {
  if (status === "resolved") {
    return { severity: currentSeverity, resolved: true };
  }
  return { severity: status, resolved: false };
}

export function getCriticismStatusLabel(item: Pick<Criticism, "severity" | "resolved">): string {
  if (item.resolved) return RESOLVED_STATUS_LABEL;
  return getSeverityLabel(item.severity);
}

export function getCriticismReportStatusLabel(
  item: Pick<Criticism, "severity" | "resolved">,
): string {
  if (item.resolved) return RESOLVED_REPORT_LABEL;
  return getSeverityReportBannerLabel(item.severity);
}

export function getCriticismIndexMeta(
  item: Criticism,
): { label: string; tone: "resolved" | "severity" } {
  if (item.resolved) {
    return { label: RESOLVED_STATUS_LABEL, tone: "resolved" };
  }
  return { label: getSeverityLabel(item.severity), tone: "severity" };
}

/** RGB per badge PDF risolto (--success / --success-light da globals.css) */
export const RESOLVED_BANNER_FILL_RGB: readonly [number, number, number] = [
  230, 245, 236,
];
export const RESOLVED_BANNER_BORDER_RGB: readonly [number, number, number] = [
  27, 122, 61,
];
export const RESOLVED_BANNER_DOT_RGB: readonly [number, number, number] = [
  27, 122, 61,
];
export const RESOLVED_BANNER_TEXT_RGB: readonly [number, number, number] = [
  27, 122, 61,
];
