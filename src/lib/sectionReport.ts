import type { SectionId } from "./inspectionSections";
import {
  getSectionDescription,
  type SectionDescriptions,
} from "./sectionDescriptions";
import type { Criticism } from "./types";

export function isSectionIncludedInReport(
  sectionId: SectionId,
  items: Criticism[],
  descriptions: SectionDescriptions,
): boolean {
  const hasItems = items.some((i) => i.sectionId === sectionId);
  const hasDesc = getSectionDescription(descriptions, sectionId).length > 0;
  return hasItems || hasDesc;
}
