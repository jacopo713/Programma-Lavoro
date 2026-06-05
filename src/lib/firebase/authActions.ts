import {
  deleteUser,
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  sendPasswordResetEmail,
  signInWithPopup,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "./client";
import { firebaseAuthErrorMessage } from "./authErrors";

export type AuthProviderId = "password" | "google.com";

export function getAuthProviders(user: User): AuthProviderId[] {
  const result: AuthProviderId[] = [];
  for (const provider of user.providerData) {
    if (provider.providerId === "password" && !result.includes("password")) {
      result.push("password");
    }
    if (provider.providerId === "google.com" && !result.includes("google.com")) {
      result.push("google.com");
    }
  }
  return result;
}

export function userHasPasswordProvider(user: User): boolean {
  return getAuthProviders(user).includes("password");
}

export function userHasGoogleProvider(user: User): boolean {
  return getAuthProviders(user).includes("google.com");
}

export async function signInWithGooglePopup(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error("Firebase non configurato");
  }

  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    throw new Error(firebaseAuthErrorMessage(error));
  }
}

export async function sendPasswordResetEmailForUser(email: string): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error("Firebase non configurato");
  }

  const trimmed = email.trim();
  if (!trimmed) {
    throw new Error("Inserisci l'indirizzo email.");
  }

  try {
    await sendPasswordResetEmail(auth, trimmed);
  } catch (error) {
    throw new Error(firebaseAuthErrorMessage(error));
  }
}

export type ReauthenticateInput = {
  password?: string;
};

export async function reauthenticateUser(
  user: User,
  input: ReauthenticateInput,
): Promise<void> {
  const providers = getAuthProviders(user);

  if (providers.includes("password")) {
    if (!input.password?.trim()) {
      throw new Error("Inserisci la password per confermare l'operazione.");
    }
    if (!user.email) {
      throw new Error("Email account non disponibile.");
    }
    const credential = EmailAuthProvider.credential(
      user.email,
      input.password.trim(),
    );
    try {
      await reauthenticateWithCredential(user, credential);
      return;
    } catch (error) {
      throw new Error(firebaseAuthErrorMessage(error));
    }
  }

  if (providers.includes("google.com")) {
    const provider = new GoogleAuthProvider();
    try {
      await reauthenticateWithPopup(user, provider);
      return;
    } catch (error) {
      throw new Error(firebaseAuthErrorMessage(error));
    }
  }

  throw new Error("Metodo di accesso non supportato per questa operazione.");
}

export async function deleteFirebaseAuthUser(user: User): Promise<void> {
  try {
    await deleteUser(user);
  } catch (error) {
    throw new Error(firebaseAuthErrorMessage(error));
  }
}
