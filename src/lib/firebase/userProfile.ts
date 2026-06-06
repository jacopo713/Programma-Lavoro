import { doc, getDoc, setDoc, type DocumentData } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { profileCacheKey } from "@/lib/constants";
import { ensureFirestoreOnline, getFirestoreDb, getFirebaseAuth } from "./client";
import {
  firestoreErrorMessage,
  isFirestoreOfflineError,
} from "./firestoreErrors";
import type { UserProfile } from "@/lib/types";

const USERS_COLLECTION = "users";

function profileDocRef(uid: string) {
  const db = getFirestoreDb();
  if (!db) {
    throw new Error("Firestore non configurato");
  }
  return doc(db, USERS_COLLECTION, uid);
}

function normalizeProfile(data: DocumentData): UserProfile {
  const now = new Date().toISOString();
  return {
    firstName: typeof data.firstName === "string" ? data.firstName : "",
    lastName: typeof data.lastName === "string" ? data.lastName : "",
    primaryStationName:
      typeof data.primaryStationName === "string" ? data.primaryStationName : "",
    additionalStationNames: Array.isArray(data.additionalStationNames)
      ? data.additionalStationNames.filter(
          (entry): entry is string => typeof entry === "string",
        )
      : [],
    onboardingCompleted: data.onboardingCompleted === true,
    onboardingSkippedAt:
      typeof data.onboardingSkippedAt === "string"
        ? data.onboardingSkippedAt
        : null,
    createdAt: typeof data.createdAt === "string" ? data.createdAt : now,
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : now,
  };
}

export function readCachedUserProfile(uid: string): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(profileCacheKey(uid));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DocumentData;
    return normalizeProfile(parsed);
  } catch {
    return null;
  }
}

export function writeCachedUserProfile(uid: string, profile: UserProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(profileCacheKey(uid), JSON.stringify(profile));
  } catch {
    /* quota */
  }
}

function profileHasRequiredFields(profile: UserProfile): boolean {
  return Boolean(
    profile.firstName.trim() &&
      profile.lastName.trim() &&
      profile.primaryStationName.trim(),
  );
}

export function resolveProfile(
  remote: UserProfile | null,
  cached: UserProfile | null,
): UserProfile | null {
  if (!remote && !cached) return null;
  if (!remote) return cached;
  if (!cached) return remote;

  const remoteNeeds = profileNeedsOnboarding(remote);
  const cachedNeeds = profileNeedsOnboarding(cached);

  if (cachedNeeds !== remoteNeeds) {
    return cachedNeeds ? remote : cached;
  }

  return remote.updatedAt >= cached.updatedAt ? remote : cached;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const cached = readCachedUserProfile(uid);

  try {
    await ensureFirestoreOnline();
    const snapshot = await getDoc(profileDocRef(uid));
    if (!snapshot.exists()) {
      return cached;
    }
    const remote = normalizeProfile(snapshot.data());
    const profile = resolveProfile(remote, cached);
    if (profile) {
      writeCachedUserProfile(uid, profile);
    }
    const usedCacheOverStaleRemote = Boolean(
      cached &&
        !profileNeedsOnboarding(cached) &&
        profileNeedsOnboarding(remote),
    );
    if (profile && usedCacheOverStaleRemote) {
      void saveUserProfile(uid, profile).catch(() => {});
    }
    return profile;
  } catch (error) {
    if (cached) return cached;
    if (isFirestoreOfflineError(error)) return null;
    throw new Error(firestoreErrorMessage(error));
  }
}

export async function saveUserProfile(
  uid: string,
  profile: UserProfile,
): Promise<void> {
  try {
    await ensureFirestoreOnline();
    await setDoc(profileDocRef(uid), profile, { merge: true });
    writeCachedUserProfile(uid, profile);
  } catch (error) {
    throw new Error(firestoreErrorMessage(error));
  }
}

export async function skipOnboarding(
  uid: string,
  existing: UserProfile | null = null,
): Promise<UserProfile> {
  const now = new Date().toISOString();
  const profile: UserProfile = {
    firstName: existing?.firstName ?? "",
    lastName: existing?.lastName ?? "",
    primaryStationName: existing?.primaryStationName ?? "",
    additionalStationNames: existing?.additionalStationNames ?? [],
    onboardingCompleted: false,
    onboardingSkippedAt: now,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  try {
    await saveUserProfile(uid, profile);
  } catch {
    writeCachedUserProfile(uid, profile);
    return profile;
  }
  return profile;
}

export interface CompleteOnboardingInput {
  firstName: string;
  lastName: string;
  primaryStationName: string;
  additionalStationNames: string[];
}

export async function completeOnboarding(
  uid: string,
  input: CompleteOnboardingInput,
  existing: UserProfile | null = null,
): Promise<UserProfile> {
  const now = new Date().toISOString();
  const profile: UserProfile = {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    primaryStationName: input.primaryStationName.trim(),
    additionalStationNames: input.additionalStationNames
      .map((name) => name.trim())
      .filter(Boolean),
    onboardingCompleted: true,
    onboardingSkippedAt: null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  try {
    await saveUserProfile(uid, profile);
  } catch {
    writeCachedUserProfile(uid, profile);
    return profile;
  }

  const auth = getFirebaseAuth();
  const displayName = [profile.firstName, profile.lastName]
    .filter(Boolean)
    .join(" ");
  if (auth?.currentUser && displayName) {
    try {
      await updateProfile(auth.currentUser, { displayName });
    } catch {
      /* non bloccare il flusso onboarding */
    }
  }

  return profile;
}

export function formatOperatorDisplayName(profile: UserProfile | null): string {
  if (!profile) return "—";
  const name = [profile.firstName, profile.lastName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
  return name || "—";
}

export function profileNeedsOnboarding(profile: UserProfile | null): boolean {
  if (!profile) return true;
  if (profile.onboardingCompleted) return false;
  if (profile.onboardingSkippedAt) return false;
  if (profileHasRequiredFields(profile)) return false;
  return true;
}
