import type { SectionId } from "./inspectionSections";
import type { SectionDescriptions } from "./sectionDescriptions";

/** 1 = da monitorare, 2 = moderato, 3 = critico */
export type SeverityLevel = 1 | 2 | 3;

export interface Criticism {
  id: number;
  sectionId: SectionId;
  title: string;
  time: string;
  photos: string[];
  severity: SeverityLevel;
  /** Voce archiviata come risolta */
  resolved: boolean;
}

export interface Station {
  id: string;
  name: string;
  createdAt: string;
}

export interface StationsRegistry {
  version: 1;
  activeStationId: string;
  stations: Station[];
}

export interface ChecklistPersisted {
  version: 3;
  items: Criticism[];
  idCounter: number;
  stationName: string;
  sectionDescriptions: SectionDescriptions;
  /** Data di redazione scelta dall'utente, formato ISO YYYY-MM-DD ("" se non impostata) */
  reportDate: string;
}

/** Formato v2 (senza sezione) per migrazione localStorage */
export interface ChecklistPersistedV2 {
  items: Criticism[];
  idCounter: number;
}

export interface PendingPhoto {
  dataUrl: string;
  /** Assente per foto già salvate (solo dataUrl) */
  file?: File;
}

export type SyncStatus = "idle" | "loading" | "syncing" | "saved" | "error";

export interface WorkspaceRegistryDoc {
  version: 1;
  activeStationId: string;
  stations: Station[];
  updatedAt: string;
}

export interface StationChecklistDoc extends ChecklistPersisted {
  updatedAt: string;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  primaryStationName: string;
  additionalStationNames: string[];
  onboardingCompleted: boolean;
  onboardingSkippedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Formato precedente (v1) per migrazione localStorage */
export interface ChecklistPersistedV1 {
  criticisms: Record<string, Omit<Criticism, "sectionId">[]>;
  idCounter: number;
}
