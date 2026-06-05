import {
  INSPECTION_SECTIONS,
  type SectionId,
} from "./inspectionSections";

export type SectionDescriptions = Record<SectionId, string>;

export function createEmptySectionDescriptions(): SectionDescriptions {
  return Object.fromEntries(
    INSPECTION_SECTIONS.map((s) => [s.id, ""]),
  ) as SectionDescriptions;
}

export function normalizeSectionDescriptions(
  value: unknown,
): SectionDescriptions {
  const base = createEmptySectionDescriptions();
  if (!value || typeof value !== "object") return base;
  const raw = value as Record<string, unknown>;
  for (const section of INSPECTION_SECTIONS) {
    const v = raw[section.id];
    if (typeof v === "string") {
      base[section.id] = v.trim();
    }
  }
  return base;
}

export function getSectionDescription(
  descriptions: SectionDescriptions,
  sectionId: SectionId,
): string {
  return descriptions[sectionId]?.trim() ?? "";
}

export function countSectionPhotos(items: { photos: string[] }[]): number {
  return items.reduce((sum, item) => sum + item.photos.length, 0);
}
