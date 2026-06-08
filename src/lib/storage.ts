import {
  checklistStorageKey,
  DEFAULT_STATION_NAME,
  MAX_TITLE_LENGTH,
  STORAGE_KEY,
  STORAGE_KEY_V1,
  STORAGE_KEY_V2,
} from "./constants";
import { normalizeReportDate } from "./format";
import {
  createStationRecord,
  getDefaultRegistry,
  loadRegistry,
  normalizeStationName as normalizeRegistryStationName,
  saveRegistrySafe,
} from "./stationsStorage";
import { rethrowIfQuotaError } from "./storageQuotaError";

export { StorageQuotaError } from "./storageQuotaError";
import { DEFAULT_SECTION_ID, normalizeSectionId } from "./inspectionSections";
import {
  createEmptySectionDescriptions,
  normalizeSectionDescriptions,
} from "./sectionDescriptions";
import { DEFAULT_SEVERITY, normalizeSeverity } from "./severity";
import type {
  ChecklistPersisted,
  ChecklistPersistedV1,
  ChecklistPersistedV2,
  Criticism,
  SeverityLevel,
  StationsRegistry,
} from "./types";

const V1_CATEGORIES = ["struttura", "pavimenti", "pareti", "infissi"] as const;

type RawCriticism = Partial<Omit<Criticism, "severity">> & {
  id: number;
  severity?: number;
  sectionId?: string;
  description?: string;
  operationalImpact?: number;
  resolved?: boolean;
  /** Campo legacy (v2 prima di title/description) */
  text?: string;
};

function migrateLegacyText(raw: RawCriticism): {
  title: string;
  description: string;
} {
  let title = (raw.title ?? "").trim();
  let description = (raw.description ?? "").trim();
  const legacy = (raw.text ?? "").trim();

  if (!title && !description && legacy) {
    const lines = legacy
      .split(/\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length > 1) {
      title = lines[0];
      description = lines.slice(1).join("\n");
    } else {
      title = legacy;
      description = "";
    }
  }

  return { title, description };
}

/** Migra scale precedenti (4 livelli o vecchia 1–3) alla scala attuale */
function migrateStoredSeverity(
  level: unknown,
  usedFourLevels: boolean,
): SeverityLevel {
  const n = typeof level === "number" ? level : NaN;
  if (usedFourLevels) {
    if (n === 1) return 1;
    if (n === 2) return 1;
    if (n === 3) return 2;
    if (n === 4) return 3;
    return DEFAULT_SEVERITY;
  }
  if (n === 1) return 1;
  if (n === 2) return 2;
  if (n === 3) return 3;
  return DEFAULT_SEVERITY;
}

function normalizeItem(raw: RawCriticism, usedFourLevels: boolean): Criticism {
  const { title, description } = migrateLegacyText(raw);
  let resolvedTitle = title;
  if (!resolvedTitle && description) {
    resolvedTitle = description.slice(0, MAX_TITLE_LENGTH);
  }
  const photos = Array.isArray(raw.photos) ? raw.photos.filter(Boolean) : [];
  return {
    id: raw.id,
    sectionId: normalizeSectionId(raw.sectionId),
    title: resolvedTitle,
    time: raw.time ?? "",
    photos: photos.length > 0 ? [photos[0]] : [],
    severity: normalizeSeverity(
      migrateStoredSeverity(raw.severity, usedFourLevels),
    ),
    resolved: raw.resolved === true,
  };
}

function normalizeChecklist(data: ChecklistPersisted): ChecklistPersisted {
  const rawItems = data.items as RawCriticism[];
  const usedFourLevels = rawItems.some((item) => item.severity === 4);
  return {
    version: 3,
    idCounter: data.idCounter,
    stationName: normalizeRegistryStationName(data.stationName),
    sectionDescriptions: normalizeSectionDescriptions(data.sectionDescriptions),
    reportDate: normalizeReportDate(data.reportDate),
    items: rawItems.map((item) => normalizeItem(item, usedFourLevels)),
  };
}

function migrateV1(parsed: ChecklistPersistedV1): ChecklistPersisted {
  const items: Criticism[] = [];
  for (const cat of V1_CATEGORIES) {
    const list = parsed.criticisms[cat];
    if (Array.isArray(list)) {
      for (const raw of list) {
        items.push(
          normalizeItem(
            {
              ...raw,
              sectionId: DEFAULT_SECTION_ID,
              severity: DEFAULT_SEVERITY,
            },
            false,
          ),
        );
      }
    }
  }
  return {
    version: 3,
    items,
    idCounter: parsed.idCounter ?? 0,
    stationName: DEFAULT_STATION_NAME,
    sectionDescriptions: createEmptySectionDescriptions(),
    reportDate: "",
  };
}

function migrateV2(parsed: ChecklistPersistedV2): ChecklistPersisted {
  const rawItems = parsed.items as RawCriticism[];
  const usedFourLevels = rawItems.some((item) => item.severity === 4);
  return {
    version: 3,
    idCounter: parsed.idCounter,
    stationName: DEFAULT_STATION_NAME,
    sectionDescriptions: createEmptySectionDescriptions(),
    reportDate: "",
    items: rawItems.map((item) =>
      normalizeItem(
        {
          ...item,
          sectionId: item.sectionId ?? DEFAULT_SECTION_ID,
        },
        usedFourLevels,
      ),
    ),
  };
}

function parsePersisted(raw: string): ChecklistPersisted | null {
  const parsed = JSON.parse(raw) as unknown;

  if (
    parsed &&
    typeof parsed === "object" &&
    "items" in parsed &&
    Array.isArray((parsed as ChecklistPersisted).items) &&
    typeof (parsed as ChecklistPersisted).idCounter === "number"
  ) {
    const data = parsed as ChecklistPersisted & { version?: number };
    const first = data.items[0] as RawCriticism | undefined;
    if (data.version === 3 || (first && "sectionId" in first)) {
      return normalizeChecklist({
        version: 3,
        items: data.items,
        idCounter: data.idCounter,
        stationName: (data as ChecklistPersisted).stationName,
        sectionDescriptions: (data as ChecklistPersisted).sectionDescriptions,
        reportDate: (data as ChecklistPersisted).reportDate,
      });
    }
    return migrateV2({
      items: data.items,
      idCounter: data.idCounter,
    });
  }

  if (
    parsed &&
    typeof parsed === "object" &&
    "criticisms" in parsed &&
    typeof (parsed as ChecklistPersistedV1).idCounter === "number"
  ) {
    return migrateV1(parsed as ChecklistPersistedV1);
  }

  return null;
}

export function loadChecklist(): ChecklistPersisted | null {
  if (typeof window === "undefined") return null;
  try {
    const rawV3 = localStorage.getItem(STORAGE_KEY);
    if (rawV3) {
      const data = parsePersisted(rawV3);
      if (data) return data;
    }

    const rawV2 = localStorage.getItem(STORAGE_KEY_V2);
    if (rawV2) {
      const data = parsePersisted(rawV2);
      if (data) {
        saveChecklist(data);
        return data;
      }
    }

    const rawV1 = localStorage.getItem(STORAGE_KEY_V1);
    if (rawV1) {
      const data = parsePersisted(rawV1);
      if (data) {
        saveChecklist(data);
        return data;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function saveChecklist(data: ChecklistPersisted): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeChecklist(data)));
}

export function getDefaultChecklist(): ChecklistPersisted {
  return {
    version: 3,
    items: [],
    idCounter: 0,
    stationName: DEFAULT_STATION_NAME,
    sectionDescriptions: createEmptySectionDescriptions(),
    reportDate: "",
  };
}

export function saveChecklistSafe(data: ChecklistPersisted): void {
  try {
    saveChecklist(data);
  } catch (err) {
    rethrowIfQuotaError(err);
  }
}

export function loadChecklistForStation(stationId: string): ChecklistPersisted | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(checklistStorageKey(stationId));
    if (!raw) return null;
    return parsePersisted(raw);
  } catch {
    return null;
  }
}

export function saveChecklistForStation(
  stationId: string,
  data: ChecklistPersisted,
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    checklistStorageKey(stationId),
    JSON.stringify(normalizeChecklist(data)),
  );
}

export function saveChecklistForStationSafe(
  stationId: string,
  data: ChecklistPersisted,
): void {
  try {
    saveChecklistForStation(stationId, data);
  } catch (err) {
    rethrowIfQuotaError(err);
  }
}

export function deleteChecklistForStation(stationId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(checklistStorageKey(stationId));
}

export interface MultiStationBootstrap {
  registry: StationsRegistry;
  checklist: ChecklistPersisted;
}

function loadLegacyChecklist(): ChecklistPersisted | null {
  if (typeof window === "undefined") return null;
  try {
    const rawV3 = localStorage.getItem(STORAGE_KEY);
    if (rawV3) {
      const data = parsePersisted(rawV3);
      if (data) return data;
    }

    const rawV2 = localStorage.getItem(STORAGE_KEY_V2);
    if (rawV2) {
      const data = parsePersisted(rawV2);
      if (data) return data;
    }

    const rawV1 = localStorage.getItem(STORAGE_KEY_V1);
    if (rawV1) {
      const data = parsePersisted(rawV1);
      if (data) return data;
    }

    return null;
  } catch {
    return null;
  }
}

export function getChecklistForStation(
  stationId: string,
  stationName: string,
): ChecklistPersisted {
  const saved = loadChecklistForStation(stationId);
  if (saved) {
    return {
      ...saved,
      stationName: normalizeRegistryStationName(saved.stationName || stationName),
    };
  }
  return {
    ...getDefaultChecklist(),
    stationName: normalizeRegistryStationName(stationName),
  };
}

export function initializeMultiStationState(): MultiStationBootstrap {
  const existingRegistry = loadRegistry();
  if (existingRegistry) {
    const active = existingRegistry.stations.find(
      (s) => s.id === existingRegistry.activeStationId,
    );
    const checklist = getChecklistForStation(
      existingRegistry.activeStationId,
      active?.name ?? DEFAULT_STATION_NAME,
    );
    return { registry: existingRegistry, checklist };
  }

  const legacy = loadLegacyChecklist();
  if (legacy) {
    const station = createStationRecord(legacy.stationName);
    const checklist = { ...legacy, stationName: station.name };
    saveChecklistForStation(station.id, checklist);
    const registry: StationsRegistry = {
      version: 1,
      activeStationId: station.id,
      stations: [station],
    };
    saveRegistrySafe(registry);
    return { registry, checklist };
  }

  const registry = getDefaultRegistry();
  const active = registry.stations[0];
  const checklist = getChecklistForStation(active.id, active.name);
  saveChecklistForStation(active.id, checklist);
  saveRegistrySafe(registry);
  return { registry, checklist };
}
