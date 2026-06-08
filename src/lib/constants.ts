export const APP_NAME = "Generatore checklist PDF";
export const APP_TAGLINE = "Compila checklist ed esporta in PDF";

export const STORAGE_KEY = "rfi-checklist-v3";
export const STORAGE_KEY_V2 = "rfi-checklist-v2";
export const STORAGE_KEY_V1 = "rfi-checklist-v1";
export const STATIONS_STORAGE_KEY = "rfi-stations-v1";
export const PROFILE_CACHE_KEY_PREFIX = "rfi-profile-cache";
export const WORKSPACE_REGISTRY_CACHE_PREFIX = "rfi-workspace-registry-cache";
export const WORKSPACE_STATION_CACHE_PREFIX = "rfi-workspace-station-cache";

export function profileCacheKey(uid: string): string {
  return `${PROFILE_CACHE_KEY_PREFIX}:${uid}`;
}

export function workspaceRegistryCacheKey(uid: string): string {
  return `${WORKSPACE_REGISTRY_CACHE_PREFIX}:${uid}`;
}

export function workspaceStationCacheKey(uid: string, stationId: string): string {
  return `${WORKSPACE_STATION_CACHE_PREFIX}:${uid}:${stationId}`;
}

export function checklistStorageKey(stationId: string): string {
  return `${STORAGE_KEY}:${stationId}`;
}

export const MAX_PHOTOS_PER_CRITICISM = 1;
/** Massimo foto selezionabili in un unico caricamento */
export const MAX_PHOTOS_PER_UPLOAD = 20;
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_TITLE_LENGTH = 120;
export const MAX_SECTION_DESCRIPTION_LENGTH = 4000;

export const DEFAULT_STATION_NAME = "Sede principale";
export const MAX_STATION_NAME_LENGTH = 80;
/** @deprecated Usare DEFAULT_STATION_NAME o stationName da storage */
export const STATION_NAME = DEFAULT_STATION_NAME;

export {
  DEFAULT_SECTION_ID,
  formatSectionHeading,
  INSPECTION_SECTION_COUNT,
  INSPECTION_SECTIONS,
} from "./inspectionSections";
