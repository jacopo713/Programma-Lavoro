import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
} from "firebase/app-check";
import { getAuth, type Auth } from "firebase/auth";
import {
  enableNetwork,
  getFirestore,
  initializeFirestore,
  type Firestore,
} from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { appCheckSiteKey, firebaseConfig, isFirebaseConfigured } from "./config";

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let storage: FirebaseStorage | undefined;
let firestore: Firestore | undefined;
let firestoreOnlinePromise: Promise<void> | null = null;
let appCheckInitialized = false;

function setupAppCheck(firebaseApp: FirebaseApp): void {
  if (appCheckInitialized || typeof window === "undefined" || !appCheckSiteKey) {
    return;
  }
  appCheckInitialized = true;

  if (process.env.NODE_ENV !== "production") {
    (
      self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }
    ).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  try {
    initializeAppCheck(firebaseApp, {
      provider: new ReCaptchaV3Provider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch {
    /* initializeAppCheck può lanciare se già inizializzato */
  }
}

function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured() || typeof window === "undefined") {
    return null;
  }

  if (!app) {
    app = getApps().length > 0 ? getApps()[0]! : initializeApp(firebaseConfig);
  }

  setupAppCheck(app);

  return app;
}

export function getFirebaseAuth(): Auth | null {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;

  if (!auth) {
    auth = getAuth(firebaseApp);
  }

  return auth;
}

export function getFirebaseStorage(): FirebaseStorage | null {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;

  if (!storage) {
    storage = getStorage(firebaseApp);
  }

  return storage;
}

export function getFirestoreDb(): Firestore | null {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;

  if (!firestore) {
    try {
      firestore = initializeFirestore(firebaseApp, {
        experimentalForceLongPolling: true,
      });
    } catch {
      firestore = getFirestore(firebaseApp);
    }
  }

  return firestore;
}

/** Call once per session; concurrent enableNetwork() triggers Firestore SDK crashes. */
export async function ensureFirestoreOnline(): Promise<void> {
  const db = getFirestoreDb();
  if (!db) {
    throw new Error("Firestore non configurato");
  }

  if (!firestoreOnlinePromise) {
    firestoreOnlinePromise = enableNetwork(db).catch(() => {
      /* proceed: enableNetwork can fail if already online */
    });
  }

  await firestoreOnlinePromise;
}
