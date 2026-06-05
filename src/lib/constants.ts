export const STORAGE_KEY = "rfi-checklist-v3";
export const STORAGE_KEY_V2 = "rfi-checklist-v2";
export const STORAGE_KEY_V1 = "rfi-checklist-v1";
export const STATIONS_STORAGE_KEY = "rfi-stations-v1";

export function checklistStorageKey(stationId: string): string {
  return `${STORAGE_KEY}:${stationId}`;
}

export const MAX_PHOTOS_PER_CRITICISM = 1;
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_TITLE_LENGTH = 120;
export const MAX_SECTION_DESCRIPTION_LENGTH = 4000;

export const DEFAULT_STATION_NAME = "Roma Termini";
export const MAX_STATION_NAME_LENGTH = 80;
/** @deprecated Usare DEFAULT_STATION_NAME o stationName da storage */
export const STATION_NAME = DEFAULT_STATION_NAME;
export const OPERATOR_NAME = "Marco Rossi";

export {
  DEFAULT_SECTION_ID,
  formatSectionHeading,
  INSPECTION_SECTION_COUNT,
  INSPECTION_SECTIONS,
} from "./inspectionSections";
