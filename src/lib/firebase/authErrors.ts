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
  "auth/popup-closed-by-user": "Accesso annullato.",
  "auth/cancelled-popup-request": "Accesso annullato. Riprova.",
  "auth/account-exists-with-different-credential":
    "Esiste già un account con questa email. Accedi con il metodo usato in registrazione.",
  "auth/requires-recent-login":
    "Per sicurezza, conferma di nuovo la tua identità e riprova.",
  "auth/missing-email": "Inserisci l'indirizzo email.",
  "auth/invalid-login-credentials": "Email o password non corretti.",
  "auth/unauthorized-domain":
    "Dominio non autorizzato. Aggiungi questo sito in Firebase Console → Authentication → Authorized domains.",
  "auth/popup-blocked":
    "Il browser ha bloccato la finestra di accesso. Consenti i popup per questo sito e riprova.",
  "auth/internal-error":
    "Errore interno di autenticazione. Verifica la configurazione Firebase del deploy.",
  "auth/api-key-not-valid.-invalid-api-key":
    "Chiave API Firebase non valida. Controlla le variabili NEXT_PUBLIC_FIREBASE_* nel deploy.",
  "auth/invalid-api-key":
    "Chiave API Firebase non valida. Controlla le variabili NEXT_PUBLIC_FIREBASE_* nel deploy.",
  "auth/access-denied":
    "Accesso negato. Se l'app OAuth è in modalità test, aggiungi il tuo account come tester.",
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
