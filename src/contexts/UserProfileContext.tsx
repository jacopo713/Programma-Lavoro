"use client";

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
import { useAuth } from "@/contexts/AuthContext";
import {
  completeOnboarding,
  formatOperatorDisplayName,
  getUserProfile,
  profileNeedsOnboarding,
  readCachedUserProfile,
  saveUserProfile,
  skipOnboarding,
  writeCachedUserProfile,
  type CompleteOnboardingInput,
} from "@/lib/firebase/userProfile";
import type { UserProfile } from "@/lib/types";

type UserProfileContextValue = {
  profile: UserProfile | null;
  loading: boolean;
  profileLoadError: string | null;
  needsOnboarding: boolean;
  wizardOpen: boolean;
  operatorDisplayName: string;
  openWizard: () => void;
  closeWizard: () => void;
  dismissWizard: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  completeOnboardingFlow: (input: CompleteOnboardingInput) => Promise<void>;
  skipOnboardingFlow: () => Promise<void>;
  updateProfileFields: (input: CompleteOnboardingInput) => Promise<void>;
};

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { user, configured, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const autoOpenedRef = useRef(false);
  const manualWizardRef = useRef(false);
  const lastUidRef = useRef<string | null>(null);

  const refreshProfile = useCallback(async () => {
    const uid = user?.uid;
    if (!uid) {
      setProfile(null);
      setProfileLoadError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setProfileLoadError(null);
    const cached = readCachedUserProfile(uid);
    if (cached) {
      setProfile(cached);
    }

    try {
      const next = await getUserProfile(uid);
      setProfile(next ?? cached ?? null);
    } catch (error) {
      console.error("Impossibile caricare il profilo:", error);
      const message =
        error instanceof Error ? error.message : "Impossibile caricare il profilo";
      setProfileLoadError(message);
      if (!cached) {
        setProfile(null);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (!configured) {
      setProfile(null);
      setLoading(false);
      return;
    }

    if (!user) {
      setProfile(null);
      if (!authLoading) {
        setLoading(false);
      }
      setWizardOpen(false);
      setProfileLoadError(null);
      autoOpenedRef.current = false;
      manualWizardRef.current = false;
      lastUidRef.current = null;
      return;
    }

    const uidChanged = lastUidRef.current !== user.uid;
    if (uidChanged) {
      autoOpenedRef.current = false;
      lastUidRef.current = user.uid;
    }

    setLoading(true);
    const cached = readCachedUserProfile(user.uid);
    if (cached) {
      setProfile(cached);
    }

    void refreshProfile();
  }, [user?.uid, configured, authLoading, refreshProfile]);

  const needsOnboarding = useMemo(() => {
    if (!user || loading || authLoading) return false;
    const cached = readCachedUserProfile(user.uid);
    const effectiveProfile = profile ?? cached;
    return profileNeedsOnboarding(effectiveProfile);
  }, [user, loading, authLoading, profile]);

  useEffect(() => {
    if (!needsOnboarding || autoOpenedRef.current || loading || authLoading) return;
    autoOpenedRef.current = true;
    setWizardOpen(true);
  }, [needsOnboarding, loading, authLoading]);

  useEffect(() => {
    if (needsOnboarding || !wizardOpen || manualWizardRef.current) return;
    setWizardOpen(false);
  }, [needsOnboarding, wizardOpen]);

  const openWizard = useCallback(() => {
    manualWizardRef.current = true;
    setWizardOpen(true);
  }, []);

  const closeWizard = useCallback(() => {
    manualWizardRef.current = false;
    setWizardOpen(false);
  }, []);

  const dismissWizard = useCallback(async () => {
    if (!user) {
      setWizardOpen(false);
      return;
    }
    try {
      const next = await skipOnboarding(user.uid, profile);
      setProfile(next);
      autoOpenedRef.current = true;
    } catch (error) {
      console.error("Impossibile registrare skip onboarding:", error);
      const now = new Date().toISOString();
      const fallback: UserProfile = {
        firstName: profile?.firstName ?? "",
        lastName: profile?.lastName ?? "",
        primaryStationName: profile?.primaryStationName ?? "",
        additionalStationNames: profile?.additionalStationNames ?? [],
        onboardingCompleted: false,
        onboardingSkippedAt: now,
        createdAt: profile?.createdAt ?? now,
        updatedAt: now,
      };
      writeCachedUserProfile(user.uid, fallback);
      setProfile(fallback);
      autoOpenedRef.current = true;
    } finally {
      manualWizardRef.current = false;
      setWizardOpen(false);
    }
  }, [user, profile]);

  const completeOnboardingFlow = useCallback(
    async (input: CompleteOnboardingInput) => {
      if (!user) {
        throw new Error("Accedi per completare il profilo");
      }
      const next = await completeOnboarding(user.uid, input, profile);
      setProfile(next);
      autoOpenedRef.current = true;
    },
    [user, profile],
  );

  const skipOnboardingFlow = useCallback(async () => {
    if (!user) {
      throw new Error("Accedi per continuare");
    }
    const next = await skipOnboarding(user.uid, profile);
    setProfile(next);
    autoOpenedRef.current = true;
    manualWizardRef.current = false;
    setWizardOpen(false);
  }, [user, profile]);

  const updateProfileFields = useCallback(
    async (input: CompleteOnboardingInput) => {
      if (!user) {
        throw new Error("Accedi per aggiornare il profilo");
      }
      const now = new Date().toISOString();
      const hasRequiredFields = Boolean(
        input.firstName.trim() &&
          input.lastName.trim() &&
          input.primaryStationName.trim(),
      );
      const onboardingCompleted =
        profile?.onboardingCompleted === true || hasRequiredFields;
      const next: UserProfile = {
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        primaryStationName: input.primaryStationName.trim(),
        additionalStationNames: input.additionalStationNames
          .map((name) => name.trim())
          .filter(Boolean),
        onboardingCompleted,
        onboardingSkippedAt: onboardingCompleted
          ? null
          : profile?.onboardingSkippedAt ?? null,
        createdAt: profile?.createdAt ?? now,
        updatedAt: now,
      };
      await saveUserProfile(user.uid, next);
      setProfile(next);

      const displayName = [next.firstName, next.lastName]
        .filter(Boolean)
        .join(" ");
      if (displayName) {
        try {
          const { updateProfile } = await import("firebase/auth");
          const { getFirebaseAuth } = await import("@/lib/firebase/client");
          const auth = getFirebaseAuth();
          if (auth?.currentUser) {
            await updateProfile(auth.currentUser, { displayName });
          }
        } catch {
          /* ignore */
        }
      }
    },
    [user, profile],
  );

  const operatorDisplayName = useMemo(
    () => formatOperatorDisplayName(profile),
    [profile],
  );

  const value = useMemo(
    () => ({
      profile,
      loading,
      profileLoadError,
      needsOnboarding,
      wizardOpen,
      operatorDisplayName,
      openWizard,
      closeWizard,
      dismissWizard,
      refreshProfile,
      completeOnboardingFlow,
      skipOnboardingFlow,
      updateProfileFields,
    }),
    [
      profile,
      loading,
      profileLoadError,
      needsOnboarding,
      wizardOpen,
      operatorDisplayName,
      openWizard,
      closeWizard,
      dismissWizard,
      refreshProfile,
      completeOnboardingFlow,
      skipOnboardingFlow,
      updateProfileFields,
    ],
  );

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile(): UserProfileContextValue {
  const ctx = useContext(UserProfileContext);
  if (!ctx) {
    throw new Error("useUserProfile must be used within UserProfileProvider");
  }
  return ctx;
}
