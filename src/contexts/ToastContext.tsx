"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { useToast, type ToastIcon } from "@/hooks/useToast";
import { Toast } from "@/components/Toast";

type ToastContextValue = {
  showToast: (message: string, icon?: ToastIcon) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { toast, showToast, iconClassName } = useToast();

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast
        message={toast.message}
        icon={toast.icon}
        visible={toast.visible}
        iconClassName={iconClassName}
      />
    </ToastContext.Provider>
  );
}

export function useAppToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useAppToast must be used within ToastProvider");
  }
  return ctx;
}
