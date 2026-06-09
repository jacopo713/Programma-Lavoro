"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useChecklist } from "@/hooks/useChecklist";

type ChecklistContextValue = ReturnType<typeof useChecklist>;

const ChecklistContext = createContext<ChecklistContextValue | null>(null);

export function ChecklistProvider({
  children,
  onStorageError,
}: {
  children: ReactNode;
  onStorageError?: () => void;
}) {
  const { user, loading: authLoading, authStatus } = useAuth();
  const authReady = !authLoading && Boolean(user) && authStatus === "authorized";
  const value = useChecklist(user?.uid ?? null, authReady, onStorageError);
  return (
    <ChecklistContext.Provider value={value}>{children}</ChecklistContext.Provider>
  );
}

export function useChecklistContext(): ChecklistContextValue {
  const ctx = useContext(ChecklistContext);
  if (!ctx) {
    throw new Error("useChecklistContext must be used within ChecklistProvider");
  }
  return ctx;
}
