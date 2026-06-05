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
  saveUserProfile,
  skipOnboarding,
  type CompleteOnboardingInput,
} from "@/lib/firebase/userProfile";
import type { UserProfile } from "@/lib/types";

type UserProfileContextValue = {
  profile: UserProfile | null;
  loading: boolean;
  needsOnboarding: boolean;
  wizardOpen: boolean;
  operatorDisplayName: string;
  openWizard: () => void;
  closeWizard: () => void;
  refreshProfile: () => Promise<void>;
  completeOnboardingFlow: (input: CompleteOnboardingInput) => Promise<void>;
  skipOnboardingFlow: () => Promise<void>;
  updateProfileFields: (input: CompleteOnboardingInput) => Promise<void>;
};

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { user, configured } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const autoOpenedRef = useRef(false);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const next = await getUserProfile(user.uid);
      setProfile(next);
    } catch (error) {
      console.error("Impossibile caricare il profilo:", error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!configured) {
      setProfile(null);
      setLoading(false);
      return;
    }

    if (!user) {
      setProfile(null);
      setLoading(false);
      setWizardOpen(false);
      autoOpenedRef.current = false;
      return;
    }

    autoOpenedRef.current = false;
    void refreshProfile();
  }, [user, configured, refreshProfile]);

  const needsOnboarding = useMemo(() => {
    if (!user || loading) return false;
    return profileNeedsOnboarding(profile);
  }, [user, loading, profile]);

  useEffect(() => {
    if (!needsOnboarding || autoOpenedRef.current) return;
    autoOpenedRef.current = true;
    setWizardOpen(true);
  }, [needsOnboarding]);

  const openWizard = useCallback(() => {
    setWizardOpen(true);
  }, []);

  const closeWizard = useCallback(() => {
    setWizardOpen(false);
  }, []);

  const completeOnboardingFlow = useCallback(
    async (input: CompleteOnboardingInput) => {
      if (!user) {
        throw new Error("Accedi per completare il profilo");
      }
      const next = await completeOnboarding(user.uid, input, profile);
      setProfile(next);
      setWizardOpen(false);
    },
    [user, profile],
  );

  const skipOnboardingFlow = useCallback(async () => {
    if (!user) {
      throw new Error("Accedi per continuare");
    }
    const next = await skipOnboarding(user.uid, profile);
    setProfile(next);
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
      needsOnboarding,
      wizardOpen,
      operatorDisplayName,
      openWizard,
      closeWizard,
      refreshProfile,
      completeOnboardingFlow,
      skipOnboardingFlow,
      updateProfileFields,
    }),
    [
      profile,
      loading,
      needsOnboarding,
      wizardOpen,
      operatorDisplayName,
      openWizard,
      closeWizard,
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
