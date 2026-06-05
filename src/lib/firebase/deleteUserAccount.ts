import { collection, deleteDoc, doc, enableNetwork, getDocs } from "firebase/firestore";
import type { User } from "firebase/auth";
import {
  PROFILE_CACHE_KEY_PREFIX,
  WORKSPACE_REGISTRY_CACHE_PREFIX,
  WORKSPACE_STATION_CACHE_PREFIX,
  profileCacheKey,
  workspaceRegistryCacheKey,
  workspaceStationCacheKey,
} from "@/lib/constants";
import type { WorkspaceRegistryDoc } from "@/lib/types";
import {
  deleteFirebaseAuthUser,
  reauthenticateUser,
  type ReauthenticateInput,
} from "./authActions";
import { deleteStationPhotos } from "./criticismPhotos";
import { getFirestoreDb } from "./client";

const USERS_COLLECTION = "users";
const WORKSPACE_COLLECTION = "workspace";

async function ensureFirestoreOnline(): Promise<void> {
  const db = getFirestoreDb();
  if (!db) {
    throw new Error("Firestore non configurato");
  }

  try {
    await enableNetwork(db);
  } catch {
    /* proceed */
  }
}

function readCachedStationIds(uid: string): string[] {
  if (typeof localStorage === "undefined") return [];

  try {
    const raw = localStorage.getItem(workspaceRegistryCacheKey(uid));
    if (!raw) return [];
    const registry = JSON.parse(raw) as WorkspaceRegistryDoc;
    return registry.stations?.map((station) => station.id) ?? [];
  } catch {
    return [];
  }
}

function clearLocalUserCaches(uid: string, stationIds: string[]): void {
  if (typeof localStorage === "undefined") return;

  localStorage.removeItem(profileCacheKey(uid));
  localStorage.removeItem(workspaceRegistryCacheKey(uid));

  const uniqueStationIds = new Set(stationIds);
  for (const stationId of uniqueStationIds) {
    localStorage.removeItem(workspaceStationCacheKey(uid, stationId));
  }

  const uidMarkers = [
    `${PROFILE_CACHE_KEY_PREFIX}:${uid}`,
    `${WORKSPACE_REGISTRY_CACHE_PREFIX}:${uid}`,
    `${WORKSPACE_STATION_CACHE_PREFIX}:${uid}:`,
  ];

  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (!key) continue;
    if (uidMarkers.some((marker) => key.startsWith(marker))) {
      localStorage.removeItem(key);
    }
  }
}

export async function purgeUserData(uid: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) {
    throw new Error("Firestore non configurato");
  }

  await ensureFirestoreOnline();

  const workspaceRef = collection(db, USERS_COLLECTION, uid, WORKSPACE_COLLECTION);
  const workspaceSnap = await getDocs(workspaceRef);
  const stationIds = new Set(readCachedStationIds(uid));

  for (const stationDoc of workspaceSnap.docs) {
    if (stationDoc.id !== "registry") {
      stationIds.add(stationDoc.id);
    }
  }

  for (const stationId of stationIds) {
    await deleteStationPhotos(uid, stationId);
  }

  for (const stationDoc of workspaceSnap.docs) {
    await deleteDoc(stationDoc.ref);
  }

  await deleteDoc(doc(db, USERS_COLLECTION, uid));
  clearLocalUserCaches(uid, [...stationIds]);
}

export async function deleteUserAccount(
  user: User,
  reauth: ReauthenticateInput,
): Promise<void> {
  await reauthenticateUser(user, reauth);
  await purgeUserData(user.uid);
  await deleteFirebaseAuthUser(user);
}
