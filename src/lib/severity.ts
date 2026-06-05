import type { SeverityLevel } from "./types";

export const SEVERITY_OPTIONS: {
  level: SeverityLevel;
  label: string;
}[] = [
  { level: 1, label: "Da monitorare" },
  { level: 2, label: "Moderato" },
  { level: 3, label: "Critico" },
];

export const DEFAULT_SEVERITY: SeverityLevel = 2;

const SEVERITY_CLASS: Record<SeverityLevel, string> = {
  1: "severity--monitor",
  2: "severity--moderate",
  3: "severity--grave",
};

/** RGB sfondo pieno (picker, cerchi) */
export const SEVERITY_RGB: Record<SeverityLevel, readonly [number, number, number]> =
  {
    1: [234, 179, 8],
    2: [234, 120, 38],
    3: [200, 16, 46],
  };

/** Colore testo su sfondo pieno */
export const SEVERITY_TEXT_RGB: Record<
  SeverityLevel,
  readonly [number, number, number]
> = {
  1: [26, 26, 26],
  2: [255, 255, 255],
  3: [255, 255, 255],
};

/** Sfondo badge PDF (tonalità chiara) */
export const SEVERITY_BANNER_FILL_RGB: Record<
  SeverityLevel,
  readonly [number, number, number]
> = {
  1: [254, 249, 220],
  2: [255, 241, 230],
  3: [254, 235, 238],
};

/** Bordo badge PDF (come `--sev-*-border` sul sito) */
export const SEVERITY_BANNER_BORDER_RGB: Record<
  SeverityLevel,
  readonly [number, number, number]
> = {
  1: [234, 179, 8],
  2: [234, 88, 12],
  3: [200, 16, 46],
};

/** Testo badge (come `--sev-*-text` sul sito) */
export const SEVERITY_BANNER_TEXT_RGB: Record<
  SeverityLevel,
  readonly [number, number, number]
> = {
  1: [146, 64, 14],
  2: [154, 52, 18],
  3: [153, 27, 27],
};

/** Pallino badge (come `--sev-*-dot` sul sito) */
export const SEVERITY_BANNER_DOT_RGB: Record<
  SeverityLevel,
  readonly [number, number, number]
> = {
  1: [202, 138, 4],
  2: [234, 88, 12],
  3: [200, 16, 46],
};

export function getSeverityClass(level: SeverityLevel): string {
  return SEVERITY_CLASS[normalizeSeverity(level)];
}

export function getSeverityLabel(level: SeverityLevel): string {
  return (
    SEVERITY_OPTIONS.find((o) => o.level === normalizeSeverity(level))?.label ??
    "Moderato"
  );
}

/** Etichetta badge sotto la descrizione (es. «Problema moderato») */
export function getSeverityBannerLabel(level: SeverityLevel): string {
  const label = getSeverityLabel(level);
  return `Problema ${label.charAt(0).toLowerCase()}${label.slice(1)}`;
}

/** Etichetta compatta in stile report (es. «PROBLEMA CRITICO», «DA MONITORARE») */
export function getSeverityReportBannerLabel(level: SeverityLevel): string {
  const n = normalizeSeverity(level);
  if (n === 1) return "DA MONITORARE";
  if (n === 2) return "PROBLEMA MODERATO";
  return "PROBLEMA CRITICO";
}

export function normalizeSeverity(level: unknown): SeverityLevel {
  if (level === 1 || level === 2 || level === 3) return level;
  return DEFAULT_SEVERITY;
}
