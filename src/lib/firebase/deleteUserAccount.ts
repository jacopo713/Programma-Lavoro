import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import type { User } from "firebase/auth";
import { clearAllLocalDataAfterAccountDeletion } from "@/lib/browserWorkspaceStorage";
import { profileCacheKey, workspaceRegistryCacheKey } from "@/lib/constants";
import type { WorkspaceRegistryDoc } from "@/lib/types";
import {
  deleteFirebaseAuthUser,
  reauthenticateUser,
  type ReauthenticateInput,
} from "./authActions";
import { deleteAllUserStorage } from "./criticismPhotos";
import { ensureFirestoreOnline, getFirestoreDb } from "./client";
import { releaseMembership } from "./membership";

const USERS_COLLECTION = "users";
const WORKSPACE_COLLECTION = "workspace";
const REGISTRY_DOC_ID = "registry";

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
    if (stationDoc.id !== REGISTRY_DOC_ID) {
      stationIds.add(stationDoc.id);
    }
  }

  await deleteAllUserStorage(uid, stationIds);

  for (const stationDoc of workspaceSnap.docs) {
    await deleteDoc(stationDoc.ref);
  }

  await deleteDoc(doc(db, USERS_COLLECTION, uid));

  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(profileCacheKey(uid));
  }

  clearAllLocalDataAfterAccountDeletion(uid, stationIds);
}

export async function deleteUserAccount(
  user: User,
  reauth: ReauthenticateInput,
): Promise<void> {
  await reauthenticateUser(user, reauth);
  await purgeUserData(user.uid);
  await releaseMembership(user.uid);
  await deleteFirebaseAuthUser(user);
}
