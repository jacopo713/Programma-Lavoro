import {
  collection,
  deleteDoc,
  doc,
  enableNetwork,
  getDoc,
  getDocs,
  setDoc,
  type DocumentData,
} from "firebase/firestore";
import {
  workspaceRegistryCacheKey,
  workspaceStationCacheKey,
} from "@/lib/constants";
import { createEmptySectionDescriptions } from "@/lib/sectionDescriptions";
import { loadRegistry } from "@/lib/stationsStorage";
import {
  getChecklistForStation,
  initializeMultiStationState,
  loadChecklistForStation,
} from "@/lib/storage";
import type {
  ChecklistPersisted,
  StationChecklistDoc,
  StationsRegistry,
  WorkspaceRegistryDoc,
} from "@/lib/types";
import { getFirestoreDb } from "./client";
import {
  firestoreErrorMessage,
  isFirestoreOfflineError,
} from "./firestoreErrors";

const WORKSPACE_COLLECTION = "workspace";
const REGISTRY_DOC_ID = "registry";

export interface LoadedWorkspace {
  registry: StationsRegistry;
  checklistsByStationId: Record<string, ChecklistPersisted>;
}

function workspaceCollectionRef(uid: string) {
  const db = getFirestoreDb();
  if (!db) {
    throw new Error("Firestore non configurato");
  }
  return collection(db, "users", uid, WORKSPACE_COLLECTION);
}

function registryDocRef(uid: string) {
  const db = getFirestoreDb();
  if (!db) {
    throw new Error("Firestore non configurato");
  }
  return doc(db, "users", uid, WORKSPACE_COLLECTION, REGISTRY_DOC_ID);
}

function stationDocRef(uid: string, stationId: string) {
  const db = getFirestoreDb();
  if (!db) {
    throw new Error("Firestore non configurato");
  }
  return doc(db, "users", uid, WORKSPACE_COLLECTION, stationId);
}

async function ensureFirestoreOnline(): Promise<void> {
  const db = getFirestoreDb();
  if (!db) {
    throw new Error("Firestore non configurato");
  }
  try {
    await enableNetwork(db);
  } catch {
    /* already online */
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

function isNewer(a: string, b: string): boolean {
  return a > b;
}

function normalizeChecklistDoc(
  data: DocumentData,
  stationName: string,
): ChecklistPersisted {
  const sectionDescriptions =
    data.sectionDescriptions &&
    typeof data.sectionDescriptions === "object" &&
    !Array.isArray(data.sectionDescriptions)
      ? (data.sectionDescriptions as ChecklistPersisted["sectionDescriptions"])
      : createEmptySectionDescriptions();

  return {
    version: 3,
    items: Array.isArray(data.items) ? (data.items as ChecklistPersisted["items"]) : [],
    idCounter: typeof data.idCounter === "number" ? data.idCounter : 0,
    stationName:
      typeof data.stationName === "string" && data.stationName.trim()
        ? data.stationName
        : stationName,
    sectionDescriptions,
  };
}

function readCachedRegistry(uid: string): WorkspaceRegistryDoc | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(workspaceRegistryCacheKey(uid));
    if (!raw) return null;
    return JSON.parse(raw) as WorkspaceRegistryDoc;
  } catch {
    return null;
  }
}

function writeCachedRegistry(uid: string, registry: WorkspaceRegistryDoc): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(workspaceRegistryCacheKey(uid), JSON.stringify(registry));
  } catch {
    /* quota */
  }
}

function readCachedStationDoc(
  uid: string,
  stationId: string,
): StationChecklistDoc | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(workspaceStationCacheKey(uid, stationId));
    if (!raw) return null;
    return JSON.parse(raw) as StationChecklistDoc;
  } catch {
    return null;
  }
}

function writeCachedStationDoc(
  uid: string,
  stationId: string,
  docData: StationChecklistDoc,
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      workspaceStationCacheKey(uid, stationId),
      JSON.stringify(docData),
    );
  } catch {
    /* quota */
  }
}

function removeCachedStationDoc(uid: string, stationId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(workspaceStationCacheKey(uid, stationId));
}

function registryFromDoc(data: DocumentData): WorkspaceRegistryDoc {
  const stations = Array.isArray(data.stations)
    ? data.stations
        .filter(
          (entry): entry is StationsRegistry["stations"][number] =>
            Boolean(entry) &&
            typeof entry === "object" &&
            typeof (entry as { id?: unknown }).id === "string" &&
            typeof (entry as { name?: unknown }).name === "string",
        )
        .map((entry) => ({
          id: entry.id,
          name: entry.name,
          createdAt:
            typeof entry.createdAt === "string"
              ? entry.createdAt
              : new Date().toISOString(),
        }))
    : [];

  const activeStationId =
    typeof data.activeStationId === "string" ? data.activeStationId : "";

  return {
    version: 1,
    activeStationId:
      stations.some((station) => station.id === activeStationId) && activeStationId
        ? activeStationId
        : (stations[0]?.id ?? ""),
    stations,
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : nowIso(),
  };
}

function pickRegistry(
  remote: WorkspaceRegistryDoc | null,
  local: WorkspaceRegistryDoc | null,
): WorkspaceRegistryDoc | null {
  if (!remote) return local;
  if (!local) return remote;
  return isNewer(remote.updatedAt, local.updatedAt) ? remote : local;
}

function pickChecklist(
  remote: StationChecklistDoc | null,
  local: StationChecklistDoc | null,
  stationName: string,
): ChecklistPersisted {
  const remoteChecklist = remote
    ? normalizeChecklistDoc(remote, stationName)
    : null;
  const localChecklist = local
    ? normalizeChecklistDoc(local, stationName)
    : null;

  if (!remote) {
    return localChecklist ?? {
      version: 3,
      items: [],
      idCounter: 0,
      stationName,
      sectionDescriptions: createEmptySectionDescriptions(),
    };
  }
  if (!local) return remoteChecklist!;

  return isNewer(remote.updatedAt, local.updatedAt)
    ? remoteChecklist!
    : localChecklist!;
}

function localWorkspaceFromBrowser(): LoadedWorkspace | null {
  const existingRegistry = loadRegistry();
  if (!existingRegistry) {
    const bootstrap = initializeMultiStationState();
    const checklistsByStationId: Record<string, ChecklistPersisted> = {
      [bootstrap.registry.activeStationId]: bootstrap.checklist,
    };
    for (const station of bootstrap.registry.stations) {
      if (!checklistsByStationId[station.id]) {
        checklistsByStationId[station.id] = getChecklistForStation(
          station.id,
          station.name,
        );
      }
    }
    return {
      registry: existingRegistry ?? bootstrap.registry,
      checklistsByStationId,
    };
  }

  const checklistsByStationId: Record<string, ChecklistPersisted> = {};
  for (const station of existingRegistry.stations) {
    checklistsByStationId[station.id] = getChecklistForStation(
      station.id,
      station.name,
    );
  }
  return { registry: existingRegistry, checklistsByStationId };
}

function toRegistryDoc(registry: StationsRegistry): WorkspaceRegistryDoc {
  return {
    version: 1,
    activeStationId: registry.activeStationId,
    stations: registry.stations,
    updatedAt: nowIso(),
  };
}

function toStationDoc(checklist: ChecklistPersisted): StationChecklistDoc {
  return {
    ...checklist,
    updatedAt: nowIso(),
  };
}

export async function loadWorkspace(uid: string): Promise<LoadedWorkspace> {
  const cachedRegistry = readCachedRegistry(uid);
  let remoteRegistry: WorkspaceRegistryDoc | null = null;
  const remoteChecklists = new Map<string, StationChecklistDoc>();

  try {
    await ensureFirestoreOnline();
    const registrySnap = await getDoc(registryDocRef(uid));
    if (registrySnap.exists()) {
      remoteRegistry = registryFromDoc(registrySnap.data());
    }

    const workspaceSnap = await getDocs(workspaceCollectionRef(uid));
    for (const stationSnap of workspaceSnap.docs) {
      if (stationSnap.id === REGISTRY_DOC_ID) continue;
      const data = stationSnap.data();
      remoteChecklists.set(stationSnap.id, {
        ...normalizeChecklistDoc(data, ""),
        updatedAt:
          typeof data.updatedAt === "string" ? data.updatedAt : nowIso(),
      });
    }
  } catch (error) {
    if (!isFirestoreOfflineError(error) && !cachedRegistry) {
      throw new Error(firestoreErrorMessage(error));
    }
  }

  const localBootstrap = localWorkspaceFromBrowser();
  const localRegistryDoc: WorkspaceRegistryDoc | null = localBootstrap
    ? {
        ...localBootstrap.registry,
        updatedAt: nowIso(),
      }
    : null;

  const mergedRegistry = pickRegistry(remoteRegistry, cachedRegistry ?? localRegistryDoc);

  if (!mergedRegistry || mergedRegistry.stations.length === 0) {
    const fallback = localBootstrap ?? {
      registry: initializeMultiStationState().registry,
      checklistsByStationId: {},
    };
    return fallback;
  }

  const checklistsByStationId: Record<string, ChecklistPersisted> = {};
  for (const station of mergedRegistry.stations) {
    const remote = remoteChecklists.get(station.id) ?? null;
    const cached = readCachedStationDoc(uid, station.id);
    const localSaved = loadChecklistForStation(station.id);
    const localDoc: StationChecklistDoc | null = localSaved
      ? { ...localSaved, updatedAt: nowIso() }
      : null;

    checklistsByStationId[station.id] = pickChecklist(
      remote,
      cached ?? localDoc,
      station.name,
    );
  }

  writeCachedRegistry(uid, mergedRegistry);
  for (const [stationId, checklist] of Object.entries(checklistsByStationId)) {
    writeCachedStationDoc(uid, stationId, toStationDoc(checklist));
  }

  if (!remoteRegistry && localBootstrap) {
    await pushWorkspaceToCloud(uid, {
      registry: mergedRegistry,
      checklistsByStationId,
    });
  }

  return {
    registry: {
      version: 1,
      activeStationId: mergedRegistry.activeStationId,
      stations: mergedRegistry.stations,
    },
    checklistsByStationId,
  };
}

export async function pushWorkspaceToCloud(
  uid: string,
  workspace: LoadedWorkspace,
): Promise<void> {
  await ensureFirestoreOnline();
  const registryDoc = toRegistryDoc(workspace.registry);
  await setDoc(registryDocRef(uid), registryDoc, { merge: true });
  writeCachedRegistry(uid, registryDoc);

  for (const station of workspace.registry.stations) {
    const checklist = workspace.checklistsByStationId[station.id];
    if (!checklist) continue;
    const stationDoc = toStationDoc({
      ...checklist,
      stationName: station.name,
    });
    await setDoc(stationDocRef(uid, station.id), stationDoc, { merge: true });
    writeCachedStationDoc(uid, station.id, stationDoc);
  }
}

export async function saveRegistryToCloud(
  uid: string,
  registry: StationsRegistry,
): Promise<void> {
  const docData = toRegistryDoc(registry);
  await ensureFirestoreOnline();
  await setDoc(registryDocRef(uid), docData, { merge: true });
  writeCachedRegistry(uid, docData);
}

export async function saveStationChecklistToCloud(
  uid: string,
  stationId: string,
  checklist: ChecklistPersisted,
): Promise<void> {
  const docData = toStationDoc(checklist);
  await ensureFirestoreOnline();
  await setDoc(stationDocRef(uid, stationId), docData, { merge: true });
  writeCachedStationDoc(uid, stationId, docData);
}

export async function deleteStationFromCloud(
  uid: string,
  stationId: string,
): Promise<void> {
  await ensureFirestoreOnline();
  await deleteDoc(stationDocRef(uid, stationId));
  removeCachedStationDoc(uid, stationId);
}
