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
import { getFirebaseAuth } from "@/lib/firebase/client";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { firebaseAuthErrorMessage } from "@/lib/firebase/authErrors";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
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

  const signUp = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error("Firebase non configurato");
    }
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      throw new Error(firebaseAuthErrorMessage(error));
    }
  }, []);

  const signOut = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    await firebaseSignOut(auth);
  }, []);

  const value = useMemo(
    () => ({ user, loading, configured, signIn, signUp, signOut }),
    [user, loading, configured, signIn, signUp, signOut],
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
