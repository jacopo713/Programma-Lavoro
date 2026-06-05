import {
  DEFAULT_STATION_NAME,
  MAX_STATION_NAME_LENGTH,
  STATIONS_STORAGE_KEY,
} from "./constants";
import { rethrowIfQuotaError } from "./storageQuotaError";
import type { Station, StationsRegistry } from "./types";

function createStationId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `station-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function normalizeStationName(value: unknown): string {
  if (typeof value !== "string") return DEFAULT_STATION_NAME;
  const trimmed = value.trim();
  if (!trimmed) return DEFAULT_STATION_NAME;
  return trimmed.slice(0, MAX_STATION_NAME_LENGTH);
}

function normalizeRegistry(data: StationsRegistry): StationsRegistry {
  const stations = data.stations
    .filter((s) => s && typeof s.id === "string" && typeof s.name === "string")
    .map((s) => ({
      id: s.id,
      name: normalizeStationName(s.name),
      createdAt: typeof s.createdAt === "string" ? s.createdAt : new Date().toISOString(),
    }));

  if (stations.length === 0) {
    const fallback = createDefaultStation();
    return {
      version: 1,
      activeStationId: fallback.id,
      stations: [fallback],
    };
  }

  const activeStationId = stations.some((s) => s.id === data.activeStationId)
    ? data.activeStationId
    : stations[0].id;

  return {
    version: 1,
    activeStationId,
    stations,
  };
}

export function createDefaultStation(name = DEFAULT_STATION_NAME): Station {
  return {
    id: createStationId(),
    name: normalizeStationName(name),
    createdAt: new Date().toISOString(),
  };
}

export function getDefaultRegistry(name = DEFAULT_STATION_NAME): StationsRegistry {
  const station = createDefaultStation(name);
  return {
    version: 1,
    activeStationId: station.id,
    stations: [station],
  };
}

export function loadRegistry(): StationsRegistry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STATIONS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StationsRegistry;
    if (
      parsed &&
      typeof parsed === "object" &&
      parsed.version === 1 &&
      Array.isArray(parsed.stations) &&
      typeof parsed.activeStationId === "string"
    ) {
      return normalizeRegistry(parsed);
    }
    return null;
  } catch {
    return null;
  }
}

export function saveRegistry(data: StationsRegistry): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STATIONS_STORAGE_KEY, JSON.stringify(normalizeRegistry(data)));
}

export function saveRegistrySafe(data: StationsRegistry): void {
  try {
    saveRegistry(data);
  } catch (err) {
    rethrowIfQuotaError(err);
  }
}

export function createStationRecord(name: string): Station {
  return createDefaultStation(name);
}
