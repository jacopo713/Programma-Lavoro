"use client";

import { useCallback, type ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChecklistProvider } from "@/contexts/ChecklistContext";
import { ToastProvider, useAppToast } from "@/contexts/ToastContext";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import { PhotoMigrationRunner } from "@/hooks/usePhotoMigration";
import { OnboardingRunner } from "@/components/OnboardingWizard";

function ChecklistProviderWithStorageToast({
  children,
}: {
  children: ReactNode;
}) {
  const { showToast } = useAppToast();
  const onStorageError = useCallback(
    () =>
      showToast(
        "Memoria locale piena — rimuovi alcune foto o criticita",
        "warning",
      ),
    [showToast],
  );

  return (
    <ChecklistProvider onStorageError={onStorageError}>
      <PhotoMigrationRunner />
      <OnboardingRunner />
      {children}
    </ChecklistProvider>
  );
}

export function ChecklistShell({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <UserProfileProvider>
        <ToastProvider>
          <ChecklistProviderWithStorageToast>
            {children}
          </ChecklistProviderWithStorageToast>
        </ToastProvider>
      </UserProfileProvider>
    </AuthProvider>
  );
}
