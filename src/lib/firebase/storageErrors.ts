import type { FirebaseError } from "firebase/app";

const STORAGE_ERROR_MESSAGES_IT: Record<string, string> = {
  "storage/unauthorized":
    "Regole Storage non configurate. Firebase Console → Storage → Rules: pubblica le regole in firebase.storage.rules (cartella users/{uid}/...).",
  "storage/canceled": "Caricamento annullato.",
  "storage/unknown": "Errore sconosciuto durante il caricamento.",
  "storage/object-not-found": "File non trovato su Firebase Storage.",
  "storage/quota-exceeded": "Spazio Storage esaurito.",
  "storage/unauthenticated": "Accedi per caricare le foto.",
  "storage/retry-limit-exceeded": "Troppi tentativi. Riprova tra poco.",
  "storage/invalid-checksum": "File corrotto durante il caricamento.",
  "storage/server-file-wrong-size": "Errore di dimensione file sul server.",
};

export function firebaseStorageErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as FirebaseError).code === "string"
  ) {
    const code = (error as FirebaseError).code;
    return STORAGE_ERROR_MESSAGES_IT[code] ?? "Errore caricamento foto. Riprova.";
  }
  return "Errore caricamento foto. Riprova.";
}
