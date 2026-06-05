"use client";

import { useCallback, type ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChecklistProvider } from "@/contexts/ChecklistContext";
import { ToastProvider, useAppToast } from "@/contexts/ToastContext";
import { PhotoMigrationRunner } from "@/hooks/usePhotoMigration";

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
      {children}
    </ChecklistProvider>
  );
}

export function ChecklistShell({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <ChecklistProviderWithStorageToast>
          {children}
        </ChecklistProviderWithStorageToast>
      </ToastProvider>
    </AuthProvider>
  );
}
