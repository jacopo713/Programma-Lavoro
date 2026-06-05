import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  type Firestore,
} from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { firebaseConfig, isFirebaseConfigured } from "./config";

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let storage: FirebaseStorage | undefined;
let firestore: Firestore | undefined;

function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured() || typeof window === "undefined") {
    return null;
  }

  if (!app) {
    app = getApps().length > 0 ? getApps()[0]! : initializeApp(firebaseConfig);
  }

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
