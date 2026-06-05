import type { FirebaseError } from "firebase/app";

const AUTH_ERROR_MESSAGES_IT: Record<string, string> = {
  "auth/configuration-not-found":
    "Authentication non è attivo nel progetto Firebase. Apri Console Firebase → Authentication → Inizia e abilita Email/Password.",
  "auth/email-already-in-use": "Questa email è già registrata.",
  "auth/invalid-email": "Indirizzo email non valido.",
  "auth/operation-not-allowed": "Accesso email non abilitato nel progetto Firebase.",
  "auth/weak-password": "La password deve avere almeno 6 caratteri.",
  "auth/user-disabled": "Account disabilitato.",
  "auth/user-not-found": "Email o password non corretti.",
  "auth/wrong-password": "Email o password non corretti.",
  "auth/invalid-credential": "Email o password non corretti.",
  "auth/too-many-requests": "Troppi tentativi. Riprova tra qualche minuto.",
  "auth/network-request-failed": "Errore di rete. Controlla la connessione.",
};

export function firebaseAuthErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as FirebaseError).code === "string"
  ) {
    const code = (error as FirebaseError).code;
    return AUTH_ERROR_MESSAGES_IT[code] ?? "Operazione non riuscita. Riprova.";
  }
  return "Operazione non riuscita. Riprova.";
}
