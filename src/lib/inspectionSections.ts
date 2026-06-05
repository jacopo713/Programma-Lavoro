/** Aree ispezione stazione (allineate al sistema legacy, 11 totali) */
export type SectionId =
  | "building"
  | "external"
  | "platforms"
  | "trackAreas"
  | "publicServices"
  | "safety"
  | "furniture"
  | "lifts"
  | "water"
  | "electrical"
  | "access";

export interface InspectionSectionDef {
  id: SectionId;
  /** Numero capitolo nel report (es. "1", "4") */
  number: string;
  title: string;
  hint: string;
}

export const INSPECTION_SECTIONS: readonly InspectionSectionDef[] = [
  {
    id: "building",
    number: "1",
    title: "Edificio principale",
    hint: "Segnala le criticità riscontrate nell'edificio di stazione.",
  },
  {
    id: "external",
    number: "2",
    title: "Aree esterne",
    hint: "Segnala le criticità nelle aree esterne e di pertinenza.",
  },
  {
    id: "platforms",
    number: "3",
    title: "Marciapiedi e sottopassi",
    hint: "Segnala le criticità su marciapiedi, banchine e sottopassi.",
  },
  {
    id: "trackAreas",
    number: "4",
    title: "Spazi tra i binari",
    hint: "Segnala le criticità negli spazi tra i binari e in prossimità sede ferroviaria.",
  },
  {
    id: "publicServices",
    number: "5",
    title: "Servizi al pubblico",
    hint: "Segnala le criticità su servizi e spazi aperti al pubblico.",
  },
  {
    id: "safety",
    number: "6",
    title: "Sicurezza e antincendio",
    hint: "Segnala le criticità su estintori, porte REI e dispositivi di sicurezza.",
  },
  {
    id: "furniture",
    number: "7",
    title: "Arredi e complementi",
    hint: "Segnala le criticità su arredi, pensiline e complementi di stazione.",
  },
  {
    id: "lifts",
    number: "8",
    title: "Ascensori e montascale",
    hint: "Segnala le criticità su ascensori, scale mobili e impianti di sollevamento.",
  },
  {
    id: "water",
    number: "9",
    title: "Impianti idrici",
    hint: "Segnala le criticità su impianti idrici e sanitari.",
  },
  {
    id: "electrical",
    number: "10",
    title: "Impianti elettrici",
    hint: "Segnala le criticità su impianti elettrici e illuminazione.",
  },
  {
    id: "access",
    number: "11",
    title: "Controllo accessi",
    hint: "Segnala le criticità su porte, tornelli e controllo accessi.",
  },
] as const;

export const SECTION_BY_ID: Record<SectionId, InspectionSectionDef> =
  Object.fromEntries(
    INSPECTION_SECTIONS.map((s) => [s.id, s]),
  ) as Record<SectionId, InspectionSectionDef>;

export const DEFAULT_SECTION_ID: SectionId = "building";

export const INSPECTION_SECTION_COUNT = INSPECTION_SECTIONS.length;

export function getSectionDef(id: SectionId): InspectionSectionDef {
  return SECTION_BY_ID[id];
}

export function isSectionId(value: unknown): value is SectionId {
  return typeof value === "string" && value in SECTION_BY_ID;
}

export function normalizeSectionId(value: unknown): SectionId {
  return isSectionId(value) ? value : DEFAULT_SECTION_ID;
}

export function formatSectionHeading(section: InspectionSectionDef): string {
  return `${section.number}. ${section.title}`;
}
