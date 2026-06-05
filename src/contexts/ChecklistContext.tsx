"use client";

import { createContext, useContext, type ReactNode } from "react";
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
  const value = useChecklist(onStorageError);
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
