import {
  LEGACY_WORKSPACE_REGISTRY_CACHE_PREFIX,
  LEGACY_WORKSPACE_STATION_CACHE_PREFIX,
  PROFILE_CACHE_KEY_PREFIX,
  STORAGE_KEY,
  STORAGE_KEY_V1,
  STORAGE_KEY_V2,
  STATIONS_STORAGE_KEY,
  WORKSPACE_REGISTRY_CACHE_PREFIX,
  WORKSPACE_STATION_CACHE_PREFIX,
  workspaceRegistryCacheKey,
  workspaceStationCacheKey,
} from "@/lib/constants";

/** Chiavi localStorage legacy (non legate all'uid Firebase). */
const LEGACY_CHECKLIST_PREFIXES = [
  `${STORAGE_KEY}:`,
  `${STORAGE_KEY_V2}:`,
  `${STORAGE_KEY_V1}:`,
] as const;

export function clearLegacyBrowserWorkspace(): void {
  if (typeof localStorage === "undefined") return;

  localStorage.removeItem(STATIONS_STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEY_V2);
  localStorage.removeItem(STORAGE_KEY_V1);

  const keysToRemove: string[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key) continue;
    if (LEGACY_CHECKLIST_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      keysToRemove.push(key);
    }
  }

  for (const key of keysToRemove) {
    localStorage.removeItem(key);
  }
}

export function clearUserScopedLocalCaches(
  uid: string,
  stationIds: Iterable<string>,
): void {
  if (typeof localStorage === "undefined") return;

  localStorage.removeItem(workspaceRegistryCacheKey(uid));
  const uniqueStationIds = new Set(stationIds);
  for (const stationId of uniqueStationIds) {
    localStorage.removeItem(workspaceStationCacheKey(uid, stationId));
  }

  const uidMarkers = [
    `${PROFILE_CACHE_KEY_PREFIX}:${uid}`,
    `${WORKSPACE_REGISTRY_CACHE_PREFIX}:${uid}`,
    `${WORKSPACE_STATION_CACHE_PREFIX}:${uid}:`,
    // Cache v1 (pre-bump): residui da rimuovere comunque
    `${LEGACY_WORKSPACE_REGISTRY_CACHE_PREFIX}:${uid}`,
    `${LEGACY_WORKSPACE_STATION_CACHE_PREFIX}:${uid}:`,
  ];

  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (!key) continue;
    if (uidMarkers.some((marker) => key.startsWith(marker))) {
      localStorage.removeItem(key);
    }
  }
}

/** Dopo eliminazione account: rimuove cache uid e dati legacy condivisi nel browser. */
export function clearAllLocalDataAfterAccountDeletion(
  uid: string,
  stationIds: Iterable<string>,
): void {
  clearUserScopedLocalCaches(uid, stationIds);
  clearLegacyBrowserWorkspace();
}
