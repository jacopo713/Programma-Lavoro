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
  useState,
  type ReactNode,
} from "react";
import {
  sendPasswordResetEmailForUser,
  signInWithGooglePopup,
} from "@/lib/firebase/authActions";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { firebaseAuthErrorMessage } from "@/lib/firebase/authErrors";
import type { ReauthenticateInput } from "@/lib/firebase/authActions";
import { deleteUserAccount as runDeleteUserAccount } from "@/lib/firebase/deleteUserAccount";

export type { ReauthenticateInput };

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  justRegistered: boolean;
  clearJustRegistered: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  deleteAccount: (reauth: ReauthenticateInput) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [justRegistered, setJustRegistered] = useState(false);
  const configured = isFirebaseConfigured();

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

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

  const signInWithGoogle = useCallback(async () => {
    await signInWithGooglePopup();
  }, []);

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
      await runDeleteUserAccount(currentUser, reauth);
    },
    [],
  );

  const signOut = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    setJustRegistered(false);
    await firebaseSignOut(auth);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      configured,
      justRegistered,
      clearJustRegistered,
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
      justRegistered,
      clearJustRegistered,
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
