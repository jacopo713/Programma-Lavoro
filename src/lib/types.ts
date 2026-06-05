import type { SectionId } from "./inspectionSections";
import type { SectionDescriptions } from "./sectionDescriptions";

/** 1 = da monitorare, 2 = moderato, 3 = critico */
export type SeverityLevel = 1 | 2 | 3;

export interface Criticism {
  id: number;
  sectionId: SectionId;
  title: string;
  time: string;
  /** Una sola foto per voce */
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
