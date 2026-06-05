function errorCode(error: unknown): string | null {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  ) {
    return (error as { code: string }).code;
  }
  return null;
}

export function isFirestoreOfflineError(error: unknown): boolean {
  const code = errorCode(error);
  if (code === "unavailable" || code === "failed-precondition") return true;

  const message =
    error instanceof Error ? error.message : String(error ?? "");
  return /client is offline/i.test(message);
}

export function firestoreErrorMessage(error: unknown): string {
  const code = errorCode(error);

  if (isFirestoreOfflineError(error)) {
    return "Impossibile contattare Firestore. Verifica la connessione e che il database Firestore sia attivo nel progetto Firebase.";
  }

  if (code === "permission-denied") {
    return "Permesso negato su Firestore. Pubblica le regole con: firebase deploy --only firestore:rules";
  }

  if (code === "not-found") {
    return "Database Firestore non trovato. Crealo dalla Console Firebase (Build → Firestore Database).";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Errore Firestore imprevisto.";
}
