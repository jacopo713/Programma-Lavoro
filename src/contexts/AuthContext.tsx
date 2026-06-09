"use client";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { clearLegacyBrowserWorkspace } from "@/lib/browserWorkspaceStorage";
import { ensureMembership } from "@/lib/firebase/membership";
import {
  deleteFirebaseAuthUser,
  sendPasswordResetEmailForUser,
  signInWithGooglePopup,
} from "@/lib/firebase/authActions";
import { releaseMembership } from "@/lib/firebase/membership";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { firebaseAuthErrorMessage } from "@/lib/firebase/authErrors";
import type { ReauthenticateInput } from "@/lib/firebase/authActions";
import { deleteUserAccount as runDeleteUserAccount, purgeUserData } from "@/lib/firebase/deleteUserAccount";

export type { ReauthenticateInput };

/**
 * Stato dell'utente loggato rispetto al limite di posti disponibili.
 * - "authorized": è un membro (o ha appena ottenuto un posto)
 * - "denied": limite massimo di utenti raggiunto
 * Significativo solo quando `user` è presente.
 */
export type AuthStatus = "checking" | "authorized" | "denied" | "error";

export type GoogleSignInResult = {
  isNewUser: boolean;
  needsLegalAcceptance: boolean;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  authStatus: AuthStatus;
  pendingLegalAcceptance: boolean;
  justRegistered: boolean;
  clearJustRegistered: () => void;
  acceptLegalConsent: () => void;
  rejectLegalConsent: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (options?: { legalAccepted?: boolean }) => Promise<GoogleSignInResult>;
  sendPasswordReset: (email: string) => Promise<void>;
  deleteAccount: (reauth: ReauthenticateInput) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const PENDING_LEGAL_CONSENT_KEY = "pendingLegalConsent";

function readPendingLegalConsentUid(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage.getItem(PENDING_LEGAL_CONSENT_KEY);
}

function writePendingLegalConsentUid(uid: string): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(PENDING_LEGAL_CONSENT_KEY, uid);
}

function clearPendingLegalConsentUid(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(PENDING_LEGAL_CONSENT_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [justRegistered, setJustRegistered] = useState(false);
  const [pendingLegalAcceptance, setPendingLegalAcceptance] = useState(false);
  const [authCheck, setAuthCheck] = useState<{
    uid: string;
    status: Exclude<AuthStatus, "checking">;
  } | null>(null);
  const previousUidRef = useRef<string | null>(null);
  /** Evita che ensureMembership parta durante signInWithGoogle, prima del gate legale. */
  const membershipPausedRef = useRef(false);
  const configured = isFirebaseConfigured();

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      const nextUid = nextUser?.uid ?? null;
      const previousUid = previousUidRef.current;

      if (previousUid && nextUid && previousUid !== nextUid) {
        clearLegacyBrowserWorkspace();
      }

      previousUidRef.current = nextUid;
      setUser(nextUser);
      setPendingLegalAcceptance(
        Boolean(nextUser && readPendingLegalConsentUid() === nextUser.uid),
      );
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user || pendingLegalAcceptance || membershipPausedRef.current) {
      return;
    }

    let cancelled = false;
    ensureMembership(user)
      .then((hasSeat) => {
        if (cancelled) return;
        setAuthCheck({ uid: user.uid, status: hasSeat ? "authorized" : "denied" });
      })
      .catch(() => {
        if (!cancelled) setAuthCheck({ uid: user.uid, status: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [user, pendingLegalAcceptance]);

  const authStatus: AuthStatus =
    user && authCheck?.uid === user.uid ? authCheck.status : "checking";

  const signIn = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error("Firebase non configurato");
    }
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      throw new Error(firebaseAuthErrorMessage(error));
    }
  }, []);

  const clearJustRegistered = useCallback(() => {
    setJustRegistered(false);
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error("Firebase non configurato");
    }
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      setJustRegistered(true);
    } catch (error) {
      throw new Error(firebaseAuthErrorMessage(error));
    }
  }, []);

  const acceptLegalConsent = useCallback(() => {
    clearPendingLegalConsentUid();
    setPendingLegalAcceptance(false);
    membershipPausedRef.current = false;
    setJustRegistered(true);
  }, []);

  const rejectLegalConsent = useCallback(async () => {
    const auth = getFirebaseAuth();
    const currentUser = auth?.currentUser;
    const uid = currentUser?.uid;

    clearPendingLegalConsentUid();
    setPendingLegalAcceptance(false);
    setJustRegistered(false);
    membershipPausedRef.current = false;

    if (!auth || !currentUser) return;

    try {
      if (uid) {
        await purgeUserData(uid).catch(() => {});
        await releaseMembership(uid);
      }
      await deleteFirebaseAuthUser(currentUser);
    } catch {
      await firebaseSignOut(auth);
    }
  }, []);

  const signInWithGoogle = useCallback(
    async (options?: { legalAccepted?: boolean }): Promise<GoogleSignInResult> => {
      const legalAccepted = options?.legalAccepted === true;
      membershipPausedRef.current = true;
      try {
        const { isNewUser } = await signInWithGooglePopup();

        if (isNewUser) {
          if (!legalAccepted) {
            const auth = getFirebaseAuth();
            const uid = auth?.currentUser?.uid;
            if (uid) {
              writePendingLegalConsentUid(uid);
            }
            setPendingLegalAcceptance(true);
            return { isNewUser: true, needsLegalAcceptance: true };
          }
          setJustRegistered(true);
        }

        return { isNewUser, needsLegalAcceptance: false };
      } finally {
        if (!readPendingLegalConsentUid()) {
          membershipPausedRef.current = false;
        }
      }
    },
    [],
  );

  const sendPasswordReset = useCallback(async (email: string) => {
    await sendPasswordResetEmailForUser(email);
  }, []);

  const deleteAccount = useCallback(
    async (reauth: ReauthenticateInput) => {
      const auth = getFirebaseAuth();
      const currentUser = auth?.currentUser;
      if (!currentUser) {
        throw new Error("Sessione scaduta. Accedi di nuovo.");
      }

      setJustRegistered(false);
      setPendingLegalAcceptance(false);
      clearPendingLegalConsentUid();
      await runDeleteUserAccount(currentUser, reauth);
    },
    [],
  );

  const signOut = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    setJustRegistered(false);
    setPendingLegalAcceptance(false);
    clearPendingLegalConsentUid();
    await firebaseSignOut(auth);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      configured,
      authStatus,
      pendingLegalAcceptance,
      justRegistered,
      clearJustRegistered,
      acceptLegalConsent,
      rejectLegalConsent,
      signIn,
      signUp,
      signInWithGoogle,
      sendPasswordReset,
      deleteAccount,
      signOut,
    }),
    [
      user,
      loading,
      configured,
      authStatus,
      pendingLegalAcceptance,
      justRegistered,
      clearJustRegistered,
      acceptLegalConsent,
      rejectLegalConsent,
      signIn,
      signUp,
      signInWithGoogle,
      sendPasswordReset,
      deleteAccount,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
